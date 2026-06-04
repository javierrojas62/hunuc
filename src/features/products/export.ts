import * as XLSX from "xlsx";
import { fetchAllProductsForExport } from "./api";

/**
 * Exporta los productos a un Excel listo para editar y reimportar.
 *
 * La columna ID permite que al reimportar se ACTUALICEN los productos
 * existentes (precio, stock, stock mínimo) en vez de duplicarlos.
 * ⚠️ No borrar ni modificar la columna ID.
 */
export async function exportProductsToExcel(includeInactive = false) {
  const rows = await fetchAllProductsForExport(includeInactive);

  const aoa = [
    ["ID", "CODIGO", "DESCRIPCION", "UNIDAD", "PRECIO", "STOCK", "STOCK_MINIMO"],
    ...rows.map((r) => [
      r.id,
      r.code ?? "",
      r.name,
      r.unit_label,
      r.price,
      r.stock,
      r.min_stock,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 38 }, // ID
    { wch: 16 }, // CODIGO
    { wch: 50 }, // DESCRIPCION
    { wch: 14 }, // UNIDAD
    { wch: 12 }, // PRECIO
    { wch: 10 }, // STOCK
    { wch: 14 }, // STOCK_MINIMO
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PRODUCTOS");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `productos_${date}.xlsx`);

  return rows.length;
}
