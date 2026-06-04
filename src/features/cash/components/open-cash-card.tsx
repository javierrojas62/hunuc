"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query/keys";
import { openCashAction } from "../actions";

export function OpenCashCard({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setLoading(true);
    const res = await openCashAction(Number(opening) || 0, notes || undefined);
    setLoading(false);
    if (!res.ok) return toast.error(res.error ?? "No se pudo abrir la caja");
    toast.success("Caja abierta");
    queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="items-center text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Wallet className="size-8 text-primary" />
        </div>
        <CardTitle>La caja está cerrada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin ? (
          <>
            <p className="text-center text-sm text-muted-foreground">
              Abrí la caja para empezar a registrar ventas.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="opening">Monto inicial (efectivo)</Label>
              <Input
                id="opening"
                type="number"
                min={0}
                placeholder="0"
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Observaciones (opcional)</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleOpen} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Abrir caja
            </Button>
          </>
        ) : (
          <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Lock className="size-4" />
            Pedile a un administrador que abra la caja.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
