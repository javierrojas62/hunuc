"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { queryKeys } from "@/lib/query/keys";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useSaleDetail } from "../hooks";
import { cancelSaleAction } from "../actions";
import { PaymentBadge } from "./payment-badge";

export function SaleDetailDialog({
  saleId,
  open,
  onOpenChange,
  isAdmin = false,
}: {
  saleId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isAdmin?: boolean;
}) {
  const { data, isLoading } = useSaleDetail(open ? saleId : null);
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    if (!saleId) return;
    startTransition(async () => {
      const res = await cancelSaleAction(saleId);
      if (!res.ok) {
        toast.error(res.error ?? "Error al cancelar la venta");
        return;
      }
      toast.success("Venta cancelada. Stock restituido.");
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
      setConfirmOpen(false);
      onOpenChange(false);
    });
  }

  const canCancel = isAdmin && data?.status === "completed";

  return (
    <>
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

              {data.status === "cancelled" ? (
                <Badge variant="destructive" className="w-full justify-center py-1.5 text-sm">
                  Venta anulada
                </Badge>
              ) : canCancel ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setConfirmOpen(true)}
                  disabled={pending}
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Cancelar venta
                </Button>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar la venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se anulará el Ticket #{data?.ticket_number}. El stock de todos los
              productos se restituirá automáticamente y se registrará el movimiento
              inverso en la caja. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Sí, cancelar venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
