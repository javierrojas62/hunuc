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
import { adjustStockAction } from "../actions";
import type { ProductViewRow } from "../api";

export function StockAdjustDialog({
  product,
  open,
  onOpenChange,
}: {
  product: ProductViewRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product) {
      setNewStock(String(product.stock));
      setReason("");
    }
  }, [open, product]);

  async function handleSubmit() {
    if (!product) return;
    setLoading(true);
    const res = await adjustStockAction({
      product_id: product.id,
      new_stock: Number(newStock),
      reason,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Error al ajustar stock");
      return;
    }
    toast.success("Stock ajustado");
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar stock</DialogTitle>
          <DialogDescription>{product?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="new-stock">Nuevo stock</Label>
            <Input
              id="new-stock"
              type="number"
              step="0.001"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Stock actual: {product?.stock}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input
              id="reason"
              placeholder="Recuento, merma, ingreso de mercadería…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
