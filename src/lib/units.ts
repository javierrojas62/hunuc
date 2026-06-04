import { BASE_UNITS, type BaseUnit } from "@/lib/constants";

export interface NormalizedUnit {
  /** Etiqueta original limpia (ej. "500 g"). */
  label: string;
  /** Valor numérico (ej. 500). null si no aplica. */
  value: number | null;
  /** Unidad base normalizada. */
  base: BaseUnit;
}

/**
 * Normaliza las ~94 variantes de unidad del Excel real a una forma canónica.
 * Ejemplos:
 *   "500gr" / "500 GR" / "500 gr"  → { value: 500, base: "g", label: "500 g" }
 *   "1 kilo" / "1kilo" / "1 KILO"  → { value: 1, base: "kg", label: "1 kg" }
 *   "UNIDAD" / "UNID" / "UNIDADES" → { value: 1, base: "unidad", label: "Unidad" }
 *   "750ML"                        → { value: 750, base: "ml", label: "750 ml" }
 */
export function normalizeUnit(raw: string | null | undefined): NormalizedUnit {
  const text = (raw ?? "").trim();
  if (!text) return { label: "Unidad", value: 1, base: BASE_UNITS.UNIT };

  const lower = text.toLowerCase().replace(/\s+/g, " ");

  // Unidades sueltas (sin cantidad explícita)
  if (/^(unid|unidad|unidades|u|un)\.?$/.test(lower)) {
    return { label: "Unidad", value: 1, base: BASE_UNITS.UNIT };
  }
  if (/^(par|pares)$/.test(lower)) {
    return { label: "Par", value: 1, base: BASE_UNITS.UNIT };
  }
  if (/^(frasco|paquete|bolsa|bolsita|caja|sobre|atado|docena)s?$/.test(lower)) {
    const label = lower.charAt(0).toUpperCase() + lower.slice(1).replace(/s$/, "");
    return { label, value: 1, base: BASE_UNITS.UNIT };
  }

  // Cantidad + unidad: "500 gr", "1kilo", "100ml", "1,5 l"
  const m = lower.match(/^([\d.,]+)\s*(kg|kilo|kilos|k|g|gr|grs|gramo|gramos|mg|ml|l|lt|litro|litros|cc)\.?$/);
  if (m) {
    const value = parseFloat(m[1].replace(",", "."));
    const unit = m[2];
    let base: BaseUnit = BASE_UNITS.UNIT;
    if (/^(kg|kilo|kilos|k)$/.test(unit)) base = BASE_UNITS.KILOGRAM;
    else if (/^(g|gr|grs|gramo|gramos)$/.test(unit)) base = BASE_UNITS.GRAM;
    else if (unit === "mg") base = BASE_UNITS.GRAM;
    else if (/^(ml|cc)$/.test(unit)) base = BASE_UNITS.MILLILITER;
    else if (/^(l|lt|litro|litros)$/.test(unit)) base = BASE_UNITS.LITER;

    const labelUnit =
      base === BASE_UNITS.KILOGRAM ? "kg" :
      base === BASE_UNITS.GRAM ? "g" :
      base === BASE_UNITS.MILLILITER ? "ml" :
      base === BASE_UNITS.LITER ? "l" : "";
    const cleanValue = Number.isInteger(value) ? value : value;
    return { label: `${cleanValue} ${labelUnit}`.trim(), value: cleanValue, base };
  }

  // No reconocido: conservar original como etiqueta, tratar como unidad
  return { label: text, value: null, base: BASE_UNITS.UNIT };
}
