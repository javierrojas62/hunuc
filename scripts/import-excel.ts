/**
 * Seed / importador del Excel real del negocio.
 *
 *   pnpm seed            → importa a Supabase (requiere credenciales en .env.local)
 *   pnpm seed -- --dry   → solo parsea y muestra estadísticas (sin tocar la DB)
 *   pnpm seed -- --file "ruta.xlsx"
 *
 * Detecta columnas, limpia encabezados repetidos/banners, normaliza unidades,
 * deriva productores (prefijo de código) y categorías (palabras clave).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readWorkbook, pickCatalogSheet } from "../src/features/import/workbook";
import { parseProductRows } from "../src/features/import/parser";

config({ path: ".env.local" });

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const RESET = args.includes("--reset");
const fileArg = args[args.indexOf("--file") + 1];
const FILE =
  fileArg && !fileArg.startsWith("--")
    ? fileArg
    : "business-assets/PLANILLAS PARA JAVIER.xlsx";

const DEFAULT_BRANCH = "00000000-0000-0000-0000-000000000001";

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

async function main() {
  console.log(`\n📄 Leyendo ${FILE} …`);
  const buf = readFileSync(resolve(FILE));
  const sheets = readWorkbook(new Uint8Array(buf));
  console.log(`   Hojas: ${sheets.map((s) => `"${s.name}"`).join(", ")}`);

  const sheet = pickCatalogSheet(sheets);
  console.log(`   Hoja de catálogo: "${sheet.name}" (${sheet.rows.length} filas)`);

  const { products, stats, columnMap } = parseProductRows(sheet.rows);

  console.log("\n📊 Análisis:");
  console.table(stats);
  console.log("   Mapa de columnas detectado:", columnMap);

  // Distribución por categoría
  const byCat = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.categorySlug] = (acc[p.categorySlug] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\n🗂  Productos por categoría:");
  console.table(byCat);

  const prefixes = [...new Set(products.map((p) => p.producerPrefix).filter(Boolean))] as string[];
  console.log(`\n🏭 Productores detectados (${prefixes.length}):`, prefixes.slice(0, 25).join(", "), prefixes.length > 25 ? "…" : "");
  console.log(`\n⚠️  Productos a revisar: ${stats.needsReview}`);
  console.log("   Ejemplos:");
  products.filter((p) => p.needsReview).slice(0, 5).forEach((p) =>
    console.log(`   · fila ${p.rowNumber} [${p.code || "s/cód"}] ${p.name} → ${p.issues.join("; ")}`),
  );

  if (DRY) {
    console.log("\n✅ Dry-run: no se escribió nada en la base.\n");
    return;
  }

  // ── Escritura en Supabase ──────────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
    console.error(
      "\n❌ Faltan credenciales reales de Supabase en .env.local " +
        "(NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY).\n" +
        "   Corré primero las migraciones + seed.sql en tu proyecto, completá .env.local y reintentá.\n" +
        "   Mientras tanto podés usar:  pnpm seed -- --dry\n",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Branch
  const branchId = process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID || DEFAULT_BRANCH;

  // Categorías: slug → id
  const { data: cats, error: catErr } = await supabase.from("categories").select("id, slug");
  if (catErr) throw catErr;
  const catMap = new Map((cats ?? []).map((c) => [c.slug, c.id]));
  if (!catMap.has("general")) {
    console.warn("⚠️  No se encontraron categorías. ¿Corriste supabase/seed.sql?");
  }

  // Productores: insertar solo los que faltan (sin depender de constraint único)
  console.log("\n🏭 Sincronizando productores…");
  const { data: existingProducers } = await supabase.from("producers").select("id, code_prefix");
  const prodMap = new Map(
    (existingProducers ?? []).filter((p) => p.code_prefix).map((p) => [p.code_prefix as string, p.id]),
  );
  const missing = prefixes.filter((p) => !prodMap.has(p));
  if (missing.length) {
    const { data: created, error } = await supabase
      .from("producers")
      .insert(missing.map((p) => ({ name: titleCase(p), code_prefix: p })))
      .select("id, code_prefix");
    if (error) throw error;
    (created ?? []).forEach((p) => p.code_prefix && prodMap.set(p.code_prefix, p.id));
  }

  // Limpiar productos existentes si se pide reset (evita duplicados)
  if (RESET) {
    console.log("🗑  --reset: eliminando productos existentes de la sucursal…");
    const { error: delErr } = await supabase
      .from("products")
      .delete()
      .eq("branch_id", branchId);
    if (delErr) throw delErr;
    console.log("   Productos eliminados.");
  } else {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId);
    if (count && count > 0) {
      console.error(
        `\n❌ Ya existen ${count} productos en la sucursal.\n` +
          "   Usá --reset para borrarlos antes de reimportar, o importá desde la app\n" +
          "   usando el Excel exportado (que tiene columna ID para actualizar sin duplicar).\n",
      );
      process.exit(1);
    }
  }

  // Productos
  console.log("📦 Insertando productos…");
  const payload = products.map((p) => ({
    code: p.code,
    name: p.name,
    unit_label: p.unitLabel,
    unit_value: p.unitValue,
    unit_base: p.unitBase,
    price: p.price,
    stock: 0,
    min_stock: 5,
    category_id: catMap.get(p.categorySlug) ?? catMap.get("general") ?? null,
    producer_id: p.producerPrefix ? (prodMap.get(p.producerPrefix) ?? null) : null,
    branch_id: branchId,
    needs_review: p.needsReview,
    is_active: true,
  }));

  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const slice = payload.slice(i, i + CHUNK);
    const { error } = await supabase.from("products").insert(slice);
    if (error) {
      console.error(`❌ Error en lote ${i / CHUNK + 1}:`, error.message);
      process.exit(1);
    }
    inserted += slice.length;
    process.stdout.write(`\r   ${inserted}/${payload.length}`);
  }

  console.log(`\n\n✅ Importación completa: ${inserted} productos, ${prefixes.length} productores.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
