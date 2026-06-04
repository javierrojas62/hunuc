"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import {
  useMetrics,
  useDailySeries,
  useTopProducts,
  useTopSellers,
  useLowStock,
  useRealtimeSales,
} from "../hooks";
import { SalesChart } from "./sales-chart";

const RANGES = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
];

export function DashboardClient({
  isAdmin,
  name,
}: {
  isAdmin: boolean;
  name: string;
}) {
  useRealtimeSales();
  const [range, setRange] = useState("today");

  const { data: metrics, isLoading: loadingMetrics } = useMetrics(range);
  const { data: series, isLoading: loadingSeries } = useDailySeries(14);
  const { data: topProducts } = useTopProducts(30, 5);
  const { data: topSellers } = useTopSellers(30);
  const { data: lowStock } = useLowStock(8);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Hola${name ? `, ${name}` : ""} 👋`}
        description={isAdmin ? "Resumen del almacén en tiempo real." : "Tu resumen de ventas."}
        actions={
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-32">
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
        }
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loadingMetrics ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Ventas" value={metrics?.sales_count ?? 0} icon={Receipt} />
            <StatCard
              label="Total vendido"
              value={formatCurrency(metrics?.sales_total ?? 0)}
              icon={DollarSign}
              tone="success"
            />
            <StatCard
              label="Ticket promedio"
              value={formatCurrency(metrics?.avg_ticket ?? 0)}
              icon={TrendingUp}
            />
            <StatCard
              label="Efectivo"
              value={formatCurrency(metrics?.by_payment?.efectivo ?? 0)}
              icon={DollarSign}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={series} isLoading={loadingSeries} />
        </div>

        {/* Top productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4" /> Más vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!topProducts ? (
              <Skeleton className="h-40 w-full" />
            ) : topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin datos aún.</p>
            ) : (
              <ol className="space-y-2">
                {topProducts.map((p, i) => (
                  <li key={p.product_id ?? i} className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{p.product_name}</span>
                    <span className="tabular-nums text-muted-foreground">{p.qty}u</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Stock bajo */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" /> Stock bajo
            </CardTitle>
            <Link href="/products" className="text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {!lowStock ? (
              <Skeleton className="h-40 w-full" />
            ) : lowStock.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Todo el stock está en orden 👍
              </p>
            ) : (
              <ul className="space-y-2">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{p.name}</span>
                    <Badge variant="destructive" className="tabular-nums">
                      {Number(p.stock)} / {Number(p.min_stock)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top vendedores (solo admin) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-amber-500" /> Top vendedores (30 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!topSellers ? (
                <Skeleton className="h-40 w-full" />
              ) : topSellers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas aún.</p>
              ) : (
                <ul className="space-y-2">
                  {topSellers.map((s, i) => (
                    <li key={s.seller_id} className="flex items-center gap-2 text-sm">
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate">{s.full_name}</span>
                      <span className="text-muted-foreground">{s.sales_count} ventas</span>
                      <span className="tabular-nums font-medium">{formatCurrency(s.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
