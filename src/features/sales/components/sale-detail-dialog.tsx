"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useSaleDetail } from "../hooks";
import { PaymentBadge } from "./payment-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function SaleDetailDialog({
  saleId,
  open,
  onOpenChange,
}: {
  saleId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data, isLoading } = useSaleDetail(open ? saleId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLoading || !data ? "Detalle de venta" : `Ticket #${data.ticket_number}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatDateTime(data.created_at)}</span>
              <PaymentBadge method={data.payment_method} />
            </div>
            {data.seller && (
              <p className="text-sm text-muted-foreground">
                Vendedor: {data.seller.full_name}
              </p>
            )}
            <Separator />
            <ul className="space-y-1.5">
              {data.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2 text-sm">
                  <span className="flex-1">
                    <span className="tabular-nums text-muted-foreground">
                      {Number(it.quantity)}×{" "}
                    </span>
                    {it.product_name}
                  </span>
                  <span className="tabular-nums">{formatCurrency(Number(it.subtotal))}</span>
                </li>
              ))}
            </ul>
            <Separator />
            {Number(data.discount) > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Descuento</span>
                <span className="tabular-nums">- {formatCurrency(Number(data.discount))}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(Number(data.total))}</span>
            </div>
            {data.status === "cancelled" && (
              <p className="text-center text-sm font-medium text-destructive">
                Venta anulada
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
