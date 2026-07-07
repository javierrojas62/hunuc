"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, AlertTriangle, Upload, Download, Loader2, Tags } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toggle } from "@/components/ui/toggle";
import { useDebounce } from "@/hooks/use-debounce";
import { queryKeys } from "@/lib/query/keys";
import type { ProductFilters } from "../schemas";
import { useProducts, useCategories, useProducers } from "../hooks";
import type { ProductViewRow } from "../api";
import { buildProductColumns } from "./product-columns";
import { ProductFormSheet } from "./product-form-sheet";
import { StockAdjustDialog } from "./stock-adjust-dialog";
import { exportProductsToExcel } from "../export";
import {
  toggleProductActiveAction,
  deleteProductAction,
} from "../actions";

const ALL = "__all__";
const PAGE_SIZE = 20;

export function ProductsClient({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [producerId, setProducerId] = useState<string | undefined>();
  const [lowStock, setLowStock] = useState(false);
  const [inactive, setInactive] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 250);

  const filters: ProductFilters = useMemo(
    () => ({
      search: debouncedSearch,
      categoryId,
      producerId,
      lowStock,
      inactive,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, categoryId, producerId, lowStock, inactive, page],
  );

  const { data, isLoading, isFetching } = useProducts(filters);
  const { data: categories } = useCategories();
  const { data: producers } = useProducers();

  // Diálogos
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductViewRow | null>(null);
  const [stockTarget, setStockTarget] = useState<ProductViewRow | null>(null);
  const [stockOpen, setStockOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductViewRow | null>(null);

  const [exporting, setExporting] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });

  async function handleExport() {
    setExporting(true);
    try {
      const n = await exportProductsToExcel(inactive);
      toast.success(`Exportados ${n} productos. Editá STOCK/PRECIO y reimportá.`);
    } catch {
      toast.error("No se pudo exportar");
    } finally {
      setExporting(false);
    }
  }

  const columns = useMemo(
    () =>
      buildProductColumns({
        isAdmin,
        onEdit: (p) => {
          setEditing(p);
          setFormOpen(true);
        },
        onAdjustStock: (p) => {
          setStockTarget(p);
          setStockOpen(true);
        },
        onToggleActive: async (p) => {
          const res = await toggleProductActiveAction(p.id, !p.is_active);
          if (!res.ok) return toast.error(res.error ?? "Error");
          toast.success(p.is_active ? "Producto desactivado" : "Producto activado");
          invalidate();
        },
        onDelete: (p) => setDeleteTarget(p),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAdmin],
  );

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(1);
      setter(v);
    };
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await deleteProductAction(deleteTarget.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar");
    } else {
      toast.success("Producto eliminado");
      invalidate();
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Productos"
        description={`${data?.count ?? 0} productos en el catálogo`}
        actions={
          isAdmin && (
            <>
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 className="animate-spin" /> : <Download />} Exportar
              </Button>
              <Button variant="outline" asChild>
                <Link href="/products/import">
                  <Upload /> Importar
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/products/categories">
                  <Tags /> Categorías
                </Link>
              </Button>
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus /> Nuevo
              </Button>
            </>
          )
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o código de barras…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            autoFocus
          />
        </div>

        <Select
          value={categoryId ?? ALL}
          onValueChange={resetPageAnd((v: string) =>
            setCategoryId(v === ALL ? undefined : v),
          )}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={producerId ?? ALL}
          onValueChange={resetPageAnd((v: string) =>
            setProducerId(v === ALL ? undefined : v),
          )}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Productor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los productores</SelectItem>
            {producers?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Toggle
          variant="outline"
          pressed={lowStock}
          onPressedChange={resetPageAnd(setLowStock)}
          aria-label="Stock bajo"
        >
          <AlertTriangle /> Stock bajo
        </Toggle>

        {isAdmin && (
          <Toggle
            variant="outline"
            pressed={inactive}
            onPressedChange={resetPageAnd(setInactive)}
            aria-label="Incluir inactivos"
          >
            Inactivos
          </Toggle>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        isLoading={isLoading}
        emptyMessage="No se encontraron productos."
      />

      {/* Paginación */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isFetching ? "Actualizando…" : `Página ${page} de ${totalPages}`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {isAdmin && (
        <>
          <ProductFormSheet
            open={formOpen}
            onOpenChange={setFormOpen}
            product={editing}
          />
          <StockAdjustDialog
            product={stockTarget}
            open={stockOpen}
            onOpenChange={setStockOpen}
          />
          <AlertDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(o) => !o && setDeleteTarget(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vas a eliminar <strong>{deleteTarget?.name}</strong>. Esta
                  acción no se puede deshacer. Si solo querés ocultarlo, mejor
                  desactivalo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
