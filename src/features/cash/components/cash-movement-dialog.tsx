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
import { addCashMovementAction } from "../actions";

export function CashMovementDialog({
  type,
  open,
  onOpenChange,
}: {
  type: "income" | "expense";
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setConcept("");
    }
  }, [open]);

  const isIncome = type === "income";

  async function handleSubmit() {
    const value = Number(amount);
    if (!value || value <= 0) return toast.error("Ingresá un monto válido");
    setLoading(true);
    const res = await addCashMovementAction(type, value, concept || undefined);
    setLoading(false);
    if (!res.ok) return toast.error(res.error ?? "Error");
    toast.success(isIncome ? "Ingreso registrado" : "Egreso registrado");
    queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isIncome ? "Registrar ingreso" : "Registrar egreso"}</DialogTitle>
          <DialogDescription>
            {isIncome
              ? "Dinero que entra a la caja (no es una venta)."
              : "Dinero que sale de la caja (gastos, retiros)."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tabular-nums"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input
              id="concept"
              placeholder={isIncome ? "Aporte, vuelto…" : "Proveedor, retiro…"}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
