import { normalizeUnit } from "@/lib/units";
import { classifyCategory, extractProducerPrefix, normalizeText } from "./classify";

export interface ParsedProduct {
  rowNumber: number;
  id: string | null;
  code: string;
  name: string;
  unitLabel: string;
  unitValue: number | null;
  unitBase: string;
  price: number;
  stock: number | null;
  minStock: number | null;
  categorySlug: string;
  producerPrefix: string | null;
  needsReview: boolean;
  issues: string[];
}

export interface ColumnMap {
  code: number;
  name: number;
  unit: number;
  price: number;
  id: number;
  stock: number;
  minStock: number;
}

export interface ParseStats {
  totalRows: number;
  headerRows: number;
  bannerRows: number;
  emptyRows: number;
  productRows: number;
  needsReview: number;
}

export interface ParseResult {
  products: ParsedProduct[];
  stats: ParseStats;
  columnMap: ColumnMap | null;
}

// Sinónimos de encabezado (tolerante a orden y variantes)
const HEADER_SYNONYMS = {
  code: ["CODIGO", "COD", "CODE", "SKU"],
  name: ["DESCRIPCION", "PRODUCTO", "NOMBRE", "DETALLE", "ARTICULO"],
  unit: ["UNIDAD", "UNID", "MEDIDA", "PRESENTACION", "PESO"],
  price: ["PRECIO", "IMPORTE", "VALOR", "$", "P. PUBLICO", "PUBLICO"],
  id: ["ID", "ID_PRODUCTO", "UUID"],
  stock: ["STOCK", "CANTIDAD", "EXISTENCIA", "EXISTENCIAS"],
  minStock: ["STOCK_MINIMO", "STOCK MINIMO", "MINIMO", "STOCK_MIN", "MIN"],
};

const DEFAULT_MAP: ColumnMap = {
  code: 0,
  name: 1,
  unit: 2,
  price: 3,
  id: -1,
  stock: -1,
  minStock: -1,
};

function cellText(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

/** ¿Esta fila es un encabezado de columnas? Devuelve el mapeo si lo es. */
function detectHeader(row: unknown[]): ColumnMap | null {
  const norm = row.map((c) => normalizeText(cellText(c)));
  const findExcept = (syns: string[], exclude: number[] = []) =>
    norm.findIndex(
      (cell, i) =>
        cell &&
        !exclude.includes(i) &&
        syns.some((s) => cell === s || cell.startsWith(s)),
    );

  const code = findExcept(HEADER_SYNONYMS.code);
  const name = findExcept(HEADER_SYNONYMS.name);
  const price = findExcept(HEADER_SYNONYMS.price);
  // Es header si reconocemos al menos código + descripción (o descripción + precio)
  if (code >= 0 && name >= 0) {
    const unit = findExcept(HEADER_SYNONYMS.unit);
    const id = findExcept(HEADER_SYNONYMS.id);
    // minStock antes que stock para que "STOCK_MINIMO" no se confunda con "STOCK"
    const minStock = findExcept(HEADER_SYNONYMS.minStock);
    const stock = findExcept(HEADER_SYNONYMS.stock, minStock >= 0 ? [minStock] : []);
    return {
      code,
      name,
      unit: unit >= 0 ? unit : DEFAULT_MAP.unit,
      price: price >= 0 ? price : DEFAULT_MAP.price,
      id,
      stock,
      minStock,
    };
  }
  return null;
}

/** ¿Fila banner/título? ("1 ALIMENTOS AGROECOLÓGICOS", "LISTA DE PRECIOS…") */
function isBanner(row: unknown[]): boolean {
  const first = normalizeText(cellText(row[0]));
  const joined = normalizeText(row.map(cellText).join(" "));
  if (first === "1" || first === "|" || /^\d+$/.test(first)) {
    if (joined.includes("LISTA DE PRECIOS") || joined.includes("AGROECOL") || joined.includes("HIERBAS")) {
      return true;
    }
  }
  return joined.includes("LISTA DE PRECIOS PUBLICO") || joined.includes("LISTA DE PRECIOS AL");
}

function isEmpty(row: unknown[]): boolean {
  return row.every((c) => cellText(c) === "");
}

/** Parsea un precio tolerando "$", puntos de miles y comas decimales. */
export function parsePrice(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = cellText(v).replace(/[^\d.,-]/g, "");
  if (!s) return 0;
  // Si hay coma y punto, asumir punto = miles, coma = decimal
  let normalized = s;
  if (s.includes(",") && s.includes(".")) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    normalized = s.replace(",", ".");
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** Parsea una cantidad (stock). Devuelve null si la celda está vacía. */
export function parseQuantity(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = cellText(v).replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const n = parseFloat(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parsea una matriz de celdas (2D) y devuelve productos limpios + estadísticas.
 * Detecta encabezados repetidos, banners y filas vacías, y normaliza unidades.
 */
export function parseProductRows(rows: unknown[][]): ParseResult {
  let columnMap: ColumnMap | null = null;
  const products: ParsedProduct[] = [];
  const stats: ParseStats = {
    totalRows: rows.length,
    headerRows: 0,
    bannerRows: 0,
    emptyRows: 0,
    productRows: 0,
    needsReview: 0,
  };

  rows.forEach((row, idx) => {
    const rowNumber = idx + 1;
    if (isEmpty(row)) {
      stats.emptyRows++;
      return;
    }
    const header = detectHeader(row);
    if (header) {
      columnMap = header;
      stats.headerRows++;
      return;
    }
    if (isBanner(row)) {
      stats.bannerRows++;
      return;
    }

    const map = columnMap ?? DEFAULT_MAP;
    const code = cellText(row[map.code]);
    const name = cellText(row[map.name]);
    const rawUnit = cellText(row[map.unit]);
    const rawPrice = row[map.price];
    const id = map.id >= 0 ? cellText(row[map.id]) || null : null;
    const stock = map.stock >= 0 ? parseQuantity(row[map.stock]) : null;
    const minStock = map.minStock >= 0 ? parseQuantity(row[map.minStock]) : null;

    // Una fila de producto necesita al menos un nombre
    if (!name) {
      stats.emptyRows++;
      return;
    }

    const issues: string[] = [];
    const price = parsePrice(rawPrice);
    const unit = normalizeUnit(rawUnit);

    if (price <= 0) issues.push("Precio en 0 o ausente");
    if (!code) issues.push("Sin código");
    if (unit.value === null && rawUnit && !/unidad|frasco|par|paquete|bolsa/i.test(unit.label)) {
      issues.push(`Unidad no reconocida: "${rawUnit}"`);
    }

    products.push({
      rowNumber,
      id,
      code,
      name,
      unitLabel: unit.label,
      unitValue: unit.value,
      unitBase: unit.base,
      price,
      stock,
      minStock,
      categorySlug: classifyCategory(name),
      producerPrefix: extractProducerPrefix(code),
      needsReview: issues.length > 0,
      issues,
    });
    stats.productRows++;
    if (issues.length > 0) stats.needsReview++;
  });

  return { products, stats, columnMap };
}
