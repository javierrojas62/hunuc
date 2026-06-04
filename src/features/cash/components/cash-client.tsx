"use client";

import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  ShoppingCart,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useCurrentCash } from "../hooks";
import { OpenCashCard } from "./open-cash-card";
import { CashMovementDialog } from "./cash-movement-dialog";
import { CloseCashDialog } from "./close-cash-dialog";

const MOVEMENT_META: Record<string, { label: string; icon: typeof Banknote; tone: string }> = {
  sale: { label: "Venta", icon: ShoppingCart, tone: "text-emerald-600 dark:text-emerald-400" },
  income: { label: "Ingreso", icon: ArrowDownCircle, tone: "text-sky-600 dark:text-sky-400" },
  expense: { label: "Egreso", icon: ArrowUpCircle, tone: "text-destructive" },
};

export function CashClient({ isAdmin }: { isAdmin: boolean }) {
  const { data, isLoading } = useCurrentCash();
  const [movementType, setMovementType] = useState<"income" | "expense" | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Caja" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.register) {
    return (
      <div className="space-y-6">
        <PageHeader title="Caja" description="Apertura, arqueo y movimientos." />
        <OpenCashCard isAdmin={isAdmin} />
      </div>
    );
  }

  const { register, movements, byMethod, totals, expectedCash } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Caja abierta"
        description={`Desde ${formatDateTime(register.opened_at)}`}
        actions={
          isAdmin && (
            <>
              <Button variant="outline" onClick={() => setMovementType("income")}>
                <TrendingUp /> Ingreso
              </Button>
              <Button variant="outline" onClick={() => setMovementType("expense")}>
                <TrendingDown /> Egreso
              </Button>
              <Button variant="destructive" onClick={() => setCloseOpen(true)}>
                <Lock /> Cerrar caja
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Apertura" value={formatCurrency(Number(register.opening_amount))} icon={Wallet} />
        <StatCard label="Ventas" value={formatCurrency(totals.sales)} icon={ShoppingCart} tone="success" />
        <StatCard label="Ingresos / Egresos" value={`${formatCurrency(totals.income)} / ${formatCurrency(totals.expense)}`} icon={TrendingUp} />
        <StatCard label="Esperado en efectivo" value={formatCurrency(expectedCash)} icon={Banknote} hint="Apertura + efectivo - egresos" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Efectivo" value={formatCurrency(byMethod.efectivo)} />
        <StatCard label="Transferencias" value={formatCurrency(byMethod.transferencia)} />
        <StatCard label="Mercado Pago" value={formatCurrency(byMethod.mercado_pago)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos ({movements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[360px]">
            {movements.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Todavía no hay movimientos en esta caja.
              </p>
            ) : (
              <ul className="divide-y">
                {movements.map((m) => {
                  const meta = MOVEMENT_META[m.type] ?? MOVEMENT_META.income;
                  return (
                    <li key={m.id} className="flex items-center gap-3 py-2.5">
                      <meta.icon className={`size-5 ${meta.tone}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {m.concept || meta.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {meta.label} · {formatDateTime(m.created_at)}
                        </p>
                      </div>
                      <span className={`tabular-nums font-semibold ${m.type === "expense" ? "text-destructive" : ""}`}>
                        {m.type === "expense" ? "-" : "+"}
                        {formatCurrency(Number(m.amount))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <CashMovementDialog
            type={movementType ?? "income"}
            open={movementType !== null}
            onOpenChange={(o) => !o && setMovementType(null)}
          />
          <CloseCashDialog
            registerId={register.id}
            expectedCash={expectedCash}
            open={closeOpen}
            onOpenChange={setCloseOpen}
          />
        </>
      )}
    </div>
  );
}
