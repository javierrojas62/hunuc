"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, PackagePlus, Power, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import type { ProductViewRow } from "../api";

export interface ProductColumnHandlers {
  isAdmin: boolean;
  onEdit: (p: ProductViewRow) => void;
  onAdjustStock: (p: ProductViewRow) => void;
  onToggleActive: (p: ProductViewRow) => void;
  onDelete: (p: ProductViewRow) => void;
}

export function buildProductColumns(
  h: ProductColumnHandlers,
): ColumnDef<ProductViewRow>[] {
  const columns: ColumnDef<ProductViewRow>[] = [
    {
      accessorKey: "name",
      header: "Producto",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{p.name}</span>
            <span className="text-xs text-muted-foreground">
              {p.code || "—"} · {p.unit_label}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "category_name",
      header: "Categoría",
      cell: ({ row }) => {
        const p = row.original;
        if (!p.category_name) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge
            variant="outline"
            style={{ borderColor: p.category_color ?? undefined, color: p.category_color ?? undefined }}
          >
            {p.category_name}
          </Badge>
        );
      },
    },
    {
      accessorKey: "producer_name",
      header: "Productor",
      cell: ({ row }) => row.original.producer_name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "price",
      header: () => <div className="text-right">Precio</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums font-medium">
          {formatCurrency(Number(row.original.price))}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: () => <div className="text-right">Stock</div>,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <span className="tabular-nums">{Number(p.stock)}</span>
            {p.is_low_stock && (
              <Badge variant="destructive" className="text-[10px]">
                bajo
              </Badge>
            )}
            {!p.is_active && (
              <Badge variant="secondary" className="text-[10px]">
                inactivo
              </Badge>
            )}
          </div>
        );
      },
    },
  ];

  if (h.isAdmin) {
    columns.push({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => h.onEdit(p)}>
                  <Pencil /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => h.onAdjustStock(p)}>
                  <PackagePlus /> Ajustar stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => h.onToggleActive(p)}>
                  <Power /> {p.is_active ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => h.onDelete(p)}>
                  <Trash2 /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    });
  }

  return columns;
}
