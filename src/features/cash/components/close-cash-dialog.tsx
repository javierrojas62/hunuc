"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query/keys";
import { formatCurrency } from "@/lib/format";
import { closeCashAction } from "../actions";

export function CloseCashDialog({
  registerId,
  expectedCash,
  open,
  onOpenChange,
}: {
  registerId: string;
  expectedCash: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCounted("");
      setNotes("");
    }
  }, [open]);

  const diff = (Number(counted) || 0) - expectedCash;

  async function handleClose() {
    setLoading(true);
    const res = await closeCashAction(registerId, Number(counted) || 0, notes || undefined);
    setLoading(false);
    if (!res.ok) return toast.error(res.error ?? "No se pudo cerrar la caja");
    const data = res.data as { difference: number };
    toast.success(
      data.difference === 0
        ? "Caja cerrada sin diferencias"
        : `Caja cerrada (diferencia ${formatCurrency(data.difference)})`,
    );
    queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar caja — Arqueo</DialogTitle>
          <DialogDescription>
            Contá el efectivo del cajón e ingresá el total para comparar con lo esperado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Esperado en efectivo</span>
            <span className="font-semibold tabular-nums">{formatCurrency(expectedCash)}</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="counted">Efectivo contado</Label>
            <Input
              id="counted"
              type="number"
              min={0}
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              className="tabular-nums"
              autoFocus
            />
          </div>
          {counted !== "" && (
            <div
              className={`flex items-center justify-between rounded-lg p-3 text-sm ${
                diff === 0
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <span>Diferencia</span>
              <span className="font-semibold tabular-nums">{formatCurrency(diff)}</span>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="close-notes">Observaciones (opcional)</Label>
            <Input id="close-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleClose} disabled={loading || counted === ""}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Cerrar caja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
