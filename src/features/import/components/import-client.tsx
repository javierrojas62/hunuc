"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import { readWorkbook, pickCatalogSheet, type SheetData } from "../workbook";
import { parseProductRows, type ParseResult } from "../parser";
import { importProductsAction } from "../actions";

const PREVIEW_LIMIT = 150;

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${tone === "warning" ? "text-destructive" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function ImportClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();

  function processSheet(all: SheetData[], name: string) {
    const sheet = all.find((s) => s.name === name);
    if (!sheet) return;
    setResult(parseProductRows(sheet.rows));
  }

  async function handleFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const all = readWorkbook(buf);
      if (!all.length) {
        toast.error("El archivo no tiene hojas legibles");
        return;
      }
      setSheets(all);
      setFileName(file.name);
      const picked = pickCatalogSheet(all);
      setActiveSheet(picked.name);
      processSheet(all, picked.name);
    } catch (e) {
      toast.error("No se pudo leer el archivo");
      console.error(e);
    }
  }

  function handleImport() {
    if (!result?.products.length) return;
    startTransition(async () => {
      const res = await importProductsAction(result.products);
      if (!res.ok) {
        toast.error(res.error ?? "Error al importar");
        return;
      }
      const parts: string[] = [];
      if (res.inserted) parts.push(`${res.inserted} nuevos`);
      if (res.updated) parts.push(`${res.updated} actualizados`);
      if (res.producers) parts.push(`${res.producers} productores`);
      toast.success(`Importación lista: ${parts.join(", ") || "sin cambios"}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      router.push("/products");
    });
  }

  const stats = result?.stats;
  const updateCount = result?.products.filter((p) => p.id).length ?? 0;
  const newCount = (result?.products.length ?? 0) - updateCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar productos"
        description="Subí un Excel o CSV. Detectamos columnas, limpiamos encabezados repetidos y normalizamos unidades automáticamente."
      />

      {/* Dropzone / file input */}
      <Card>
        <CardContent className="p-6">
          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center transition-colors hover:bg-accent/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium">
              {fileName || "Arrastrá un archivo o hacé clic para elegir"}
            </span>
            <span className="text-xs text-muted-foreground">.xlsx, .xls o .csv</span>
            <input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>

          {sheets.length > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Hoja:</span>
              <Select
                value={activeSheet}
                onValueChange={(v) => {
                  setActiveSheet(v);
                  processSheet(sheets, v);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sheets.map((s) => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name} ({s.rows.length} filas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && result && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Productos" value={stats.productRows} />
            <StatCard label="A revisar" value={stats.needsReview} tone="warning" />
            <StatCard label="Headers limpiados" value={stats.headerRows} />
            <StatCard label="Banners" value={stats.bannerRows} />
            <StatCard label="Vacías" value={stats.emptyRows} />
            <StatCard label="Total filas" value={stats.totalRows} />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">
                Vista previa{" "}
                <span className="font-normal text-muted-foreground">
                  ({Math.min(PREVIEW_LIMIT, result.products.length)} de {result.products.length})
                </span>
              </CardTitle>
              <Button onClick={handleImport} disabled={pending || !result.products.length}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {updateCount > 0
                  ? `Aplicar (${newCount} nuevos · ${updateCount} a actualizar)`
                  : `Importar ${result.products.length} productos`}
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[460px] rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Revisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.products.slice(0, PREVIEW_LIMIT).map((p) => (
                      <TableRow key={p.rowNumber} className={p.needsReview ? "bg-destructive/5" : ""}>
                        <TableCell className="text-muted-foreground">{p.rowNumber}</TableCell>
                        <TableCell className="font-mono text-xs">{p.code || "—"}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.unitLabel}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(p.price)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.stock ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.id ? "default" : "secondary"} className="text-xs">
                            {p.id ? "Actualiza" : "Nuevo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{p.categorySlug}</Badge>
                        </TableCell>
                        <TableCell>
                          {p.needsReview ? (
                            <span className="flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="size-3" />
                              {p.issues[0]}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">OK</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
