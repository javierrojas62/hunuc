import * as XLSX from "xlsx";

export interface SheetData {
  name: string;
  rows: unknown[][];
}

/** Lee un workbook (xlsx/csv) desde un ArrayBuffer y devuelve filas 2D por hoja. */
export function readWorkbook(data: ArrayBuffer | Uint8Array): SheetData[] {
  const wb = XLSX.read(data, { type: "array" });
  return wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(wb.Sheets[name], {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
    }) as unknown[][],
  }));
}

/** Heurística: elige la hoja que parece catálogo de precios. */
export function pickCatalogSheet(sheets: SheetData[]): SheetData {
  const byName = sheets.find((s) => /precio|lista|catalogo|catálogo|producto/i.test(s.name));
  if (byName) return byName;
  // Si no, la hoja con más filas
  return sheets.reduce((a, b) => (b.rows.length > a.rows.length ? b : a), sheets[0]);
}
