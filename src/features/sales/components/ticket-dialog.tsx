"use client";

import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

export function TicketDialog({
  open,
  onClose,
  ticketNumber,
  total,
}: {
  open: boolean;
  onClose: () => void;
  ticketNumber?: number;
  total?: number;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="rounded-full bg-success/15 p-3">
            <CheckCircle2 className="size-10 text-success" />
          </div>
          <DialogTitle className="text-xl">¡Venta registrada!</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 text-center">
          <p className="text-sm text-muted-foreground">Ticket N°</p>
          <p className="text-2xl font-bold tabular-nums">#{ticketNumber}</p>
          <p className="text-3xl font-bold tabular-nums text-primary">
            {formatCurrency(total)}
          </p>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={onClose} autoFocus>
            Nueva venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
