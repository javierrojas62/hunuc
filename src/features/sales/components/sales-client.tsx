"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { useSales } from "../hooks";
import type { SaleListRow, SaleListFilters } from "../api";
import { PaymentBadge } from "./payment-badge";
import { SaleDetailDialog } from "./sale-detail-dialog";

const ALL = "__all__";
const RANGES = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "all", label: "Todas" },
];

function rangeToFrom(range: string): string | undefined {
  const d = new Date();
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === "7d") return new Date(Date.now() - 7 * 864e5).toISOString();
  if (range === "30d") return new Date(Date.now() - 30 * 864e5).toISOString();
  return undefined;
}

export function SalesClient({ isAdmin }: { isAdmin: boolean }) {
  const [range, setRange] = useState("today");
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filters: SaleListFilters = useMemo(
    () => ({ from: rangeToFrom(range), paymentMethod, page, pageSize: 25 }),
    [range, paymentMethod, page],
  );

  const { data, isLoading, isFetching } = useSales(filters);

  const totalAmount = useMemo(
    () =>
      (data?.rows ?? [])
        .filter((r) => r.status === "completed")
        .reduce((s, r) => s + Number(r.total), 0),
    [data],
  );

  const columns = useMemo<ColumnDef<SaleListRow>[]>(() => {
    const cols: ColumnDef<SaleListRow>[] = [
      {
        accessorKey: "ticket_number",
        header: "Ticket",
        cell: ({ row }) => <span className="font-mono">#{row.original.ticket_number}</span>,
      },
      {
        accessorKey: "created_at",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.created_at)}
          </span>
        ),
      },
    ];
    if (isAdmin) {
      cols.push({
        id: "seller",
        header: "Vendedor",
        cell: ({ row }) => row.original.seller?.full_name ?? "—",
      });
    }
    cols.push(
      {
        accessorKey: "items_count",
        header: "Ítems",
        cell: ({ row }) => <span className="tabular-nums">{row.original.items_count}</span>,
      },
      {
        accessorKey: "payment_method",
        header: "Pago",
        cell: ({ row }) => <PaymentBadge method={row.original.payment_method} />,
      },
      {
        accessorKey: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums">
            {formatCurrency(Number(row.original.total))}
            {row.original.status === "cancelled" && (
              <Badge variant="destructive" className="ml-2 text-[10px]">anulada</Badge>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setDetailId(row.original.id)}>
              <Eye className="size-4" />
            </Button>
          </div>
        ),
      },
    );
    return cols;
  }, [isAdmin]);

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 25));

  return (
    <div className="space-y-4">
      <PageHeader title="Ventas" description="Historial de ventas registradas." />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={range}
          onValueChange={(v) => {
            setPage(1);
            setRange(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={paymentMethod ?? ALL}
          onValueChange={(v) => {
            setPage(1);
            setPaymentMethod(v === ALL ? undefined : v);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Método de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los pagos</SelectItem>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Card className="ml-auto w-full sm:w-auto">
          <CardContent className="flex items-center gap-3 px-4 py-2">
            <span className="text-sm text-muted-foreground">Total del período</span>
            <span className="text-lg font-bold tabular-nums">{formatCurrency(totalAmount)}</span>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        isLoading={isLoading}
        emptyMessage="No hay ventas en este período."
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{isFetching ? "Actualizando…" : `${data?.count ?? 0} ventas`}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      </div>

      <SaleDetailDialog
        saleId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(o) => !o && setDetailId(null)}
        isAdmin={isAdmin}
      />
    </div>
  );
}
