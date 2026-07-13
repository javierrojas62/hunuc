"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import { queryKeys } from "@/lib/query/keys";
import type { ProductViewRow } from "@/features/products/api";
import { createSaleAction } from "../actions";
import { PosSearch } from "./pos-search";
import { PosCart } from "./pos-cart";
import { TicketDialog } from "./ticket-dialog";

export function PosClient() {
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const discount = useCartStore((s) => s.discount);
  const note = useCartStore((s) => s.note);
  const clear = useCartStore((s) => s.clear);

  const [pending, startTransition] = useTransition();
  const [ticket, setTicket] = useState<{ open: boolean; number?: number; total?: number }>({
    open: false,
  });

  function handleSelect(p: ProductViewRow) {
    const inCart = items.find((i) => i.productId === p.id);
    if (inCart && inCart.quantity >= Number(p.stock)) {
      toast.warning(`Stock máximo de ${p.name} (${Number(p.stock)})`);
      return;
    }
    addItem({
      productId: p.id,
      code: p.code ?? "",
      name: p.name,
      unitLabel: p.unit_label,
      price: Number(p.price),
      stock: Number(p.stock),
    });
  }

  function handleCheckout() {
    if (items.length === 0) return;
    startTransition(async () => {
      const res = await createSaleAction({
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.price,
        })),
        payment_method: paymentMethod,
        discount,
        note: note || undefined,
      });

      if (!res.ok) {
        toast.error(res.error ?? "No se pudo registrar la venta");
        return;
      }
      setTicket({ open: true, number: res.ticketNumber, total: res.total });
      clear();
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
    });
  }

  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_23.75rem] xl:grid-cols-[1fr_26.25rem]">
      <div className="flex min-h-[50vh] min-w-0 flex-col lg:h-[calc(100svh-7.5rem)]">
        <PosSearch onSelect={handleSelect} />
      </div>
      <div className="min-h-[50vh] min-w-0 lg:h-[calc(100svh-7.5rem)]">
        <PosCart onCheckout={handleCheckout} checkingOut={pending} />
      </div>

      <TicketDialog
        open={ticket.open}
        onClose={() => setTicket({ open: false })}
        ticketNumber={ticket.number}
        total={ticket.total}
      />
    </div>
  );
}
