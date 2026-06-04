/** Normaliza texto: mayúsculas, sin acentos, sin espacios extra. */
export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clasifica un producto en una categoría (slug) según palabras clave de su
 * descripción. Devuelve "general" si no hay coincidencia.
 * Los slugs coinciden con los sembrados en supabase/seed.sql.
 */
const RULES: Array<{ slug: string; keywords: string[] }> = [
  { slug: "legumbres", keywords: ["LENTEJA", "ARVEJA", "POROTO", "GARBANZO", "SOJA", "MUNG", "ADUKI", "LEGUMBRE"] },
  { slug: "cereales-harinas", keywords: ["HARINA", "AVENA", "ARROZ", "QUINOA", "QUINUA", "TRIGO", "MAIZ", "MAÍZ", "POLENTA", "SARRACENO", "CEREAL", "SALVADO", "GERMEN", "FIDEO", "PASTA", "YAMANI"] },
  { slug: "conservas-escabeches", keywords: ["ESCABECHE", "ACEITUNA", "TOMATE", "CONSERVA", "ENCURTIDO", "PICKLE", "GIRGOLA", "GÍRGOLA", "SHIITAKE", "HONGO", "VINAGRE", "CEBOLLITA", "MERMELADA", "DULCE"] },
  { slug: "aceites-aderezos", keywords: ["ACEITE", "OLIVA", "MOSTAZA", "KETCHU", "KETCHUP", "SALSA", "ADEREZO", "MAYONESA", "PESTO", "ACHETTO"] },
  { slug: "endulzantes", keywords: ["AZUCAR", "AZÚCAR", "MIEL", "MASCABO", "STEVIA", "ENDULZANTE", "MELAZA", "ALGARROBA"] },
  { slug: "yerba-hierbas", keywords: ["YERBA", "MATE", "TE ", "TÉ", "HIERBA", "CAFE", "CAFÉ", "INFUSION", "INFUSIÓN", "MANZANILLA", "BOLDO", "TILO", "CEDRON"] },
  { slug: "frutos-secos", keywords: ["CASTAÑA", "CASTANA", "NUEZ", "NUECES", "ALMENDRA", "MANI", "MANÍ", "PASA", "SEMILLA", "GIRASOL", "LINO", "SESAMO", "SÉSAMO", "CHIA", "CHÍA", "FRUTO SECO", "DATIL", "DÁTIL", "CIRUELA"] },
  { slug: "lacteos-huevos", keywords: ["HUEVO", "QUESO", "LECHE", "YOGUR", "MANTECA", "DULCE DE LECHE"] },
  { slug: "panaderia", keywords: ["PAN", "SEMITA", "GALLETA", "BIZCOCHO", "FACTURA", "TORTA", "BUDIN", "BUDÍN", "ALFAJOR"] },
  { slug: "especias-condimentos", keywords: ["SAL", "OREGANO", "ORÉGANO", "JENGIBRE", "PIMIENTA", "COMINO", "PIMENTON", "PIMENTÓN", "CONDIMENTO", "ESPECIA", "PROVENZAL", "CURCUMA", "CÚRCUMA", "AJI", "AJÍ", "LAUREL", "ROMERO"] },
  { slug: "bebidas", keywords: ["AGUA", "JUGO", "BEBIDA", "VINO", "CERVEZA", "GASEOSA", "LIMONADA", "KOMBUCHA"] },
  { slug: "cosmetica-natural", keywords: ["JABON", "JABÓN", "CREMA", "SHAMPOO", "SHAMPÚ", "ACEITE ESENCIAL", "COSMETIC", "DESODORANTE", "PASTA DENTAL", "BALSAMO", "BÁLSAMO", "RESINA", "PALOSANTO", "PALO SANTO", "AROMA", "SAHUMERIO", "INCIENSO"] },
  { slug: "limpieza", keywords: ["DETERGENTE", "LIMPIEZA", "LAVANDINA", "DESENGRASANTE", "LIMPIADOR", "TOALLITA"] },
];

export function classifyCategory(description: string): string {
  const text = normalizeText(description);
  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(normalizeText(k)))) {
      return rule.slug;
    }
  }
  return "general";
}

/** Extrae el prefijo de productor del código (letras iniciales). EA3 → EA. */
export function extractProducerPrefix(code: string): string | null {
  const m = code.trim().match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ]{2,})/);
  if (!m) return null;
  return m[1].toUpperCase();
}
