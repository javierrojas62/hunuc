"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { useAuditLogs } from "../hooks";
import { AUDIT_ACTIONS, type AuditRow, type AuditFilters } from "../api";

const ALL = "__all__";
const ACTION_LABEL = Object.fromEntries(AUDIT_ACTIONS.map((a) => [a.value, a.label]));

export function AuditClient() {
  const [action, setAction] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const filters: AuditFilters = useMemo(() => ({ action, page, pageSize: 30 }), [action, page]);
  const { data, isLoading, isFetching } = useAuditLogs(filters);

  const columns = useMemo<ColumnDef<AuditRow>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(row.original.created_at)}</span>
        ),
      },
      {
        accessorKey: "user",
        header: "Usuario",
        cell: ({ row }) => row.original.user?.full_name ?? <span className="text-muted-foreground">Sistema</span>,
      },
      {
        accessorKey: "action",
        header: "Acción",
        cell: ({ row }) => (
          <Badge variant="outline">{ACTION_LABEL[row.original.action] ?? row.original.action}</Badge>
        ),
      },
      {
        accessorKey: "entity",
        header: "Entidad",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.entity ?? "—"}
          </span>
        ),
      },
      {
        id: "device",
        header: "Dispositivo",
        cell: ({ row }) => {
          const r = row.original;
          if (!r.device && !r.browser) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="text-xs text-muted-foreground">
              {[r.device, r.browser].filter(Boolean).join(" · ")}
              {r.ip ? ` · ${r.ip}` : ""}
            </span>
          );
        },
      },
    ],
    [],
  );

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 30));

  return (
    <div className="space-y-4">
      <PageHeader title="Auditoría" description="Registro de actividad del sistema." />

      <div className="flex items-center gap-2">
        <Select
          value={action ?? ALL}
          onValueChange={(v) => {
            setPage(1);
            setAction(v === ALL ? undefined : v);
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las acciones</SelectItem>
            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        isLoading={isLoading}
        emptyMessage="Sin registros de auditoría."
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{isFetching ? "Actualizando…" : `${data?.count ?? 0} registros`}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
