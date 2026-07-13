"use client";

import { Minus, Plus, Trash2, ShoppingCart, Loader2, Banknote, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: PAYMENT_METHODS.CASH, label: "Efectivo", icon: Banknote },
  { value: PAYMENT_METHODS.TRANSFER, label: "Transfer.", icon: CreditCard },
  { value: PAYMENT_METHODS.MERCADO_PAGO, label: "Mer. Pago", icon: Smartphone },
];

export function PosCart({
  onCheckout,
  checkingOut,
}: {
  onCheckout: () => void;
  checkingOut: boolean;
}) {
  const items = useCartStore((s) => s.items);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const discount = useCartStore((s) => s.discount);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);
  const setDiscount = useCartStore((s) => s.setDiscount);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());
  const total = useCartStore((s) => s.total());
  const itemCount = useCartStore((s) => s.itemCount());

  const empty = items.length === 0;

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="size-5" />
          Carrito {itemCount > 0 && <span className="text-muted-foreground">({itemCount})</span>}
        </div>
        {!empty && (
          <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
            Vaciar
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <ShoppingCart className="size-10 opacity-40" />
            <p className="text-sm">El carrito está vacío</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.productId} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.price)} · {item.unitLabel}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="outline" size="icon" className="size-7" onClick={() => decrement(item.productId)}>
                      <Minus className="size-3" />
                    </Button>
                    <Input
                      value={item.quantity}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v)) setQuantity(item.productId, v);
                      }}
                      className="h-7 w-12 px-1 text-center tabular-nums"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      disabled={item.quantity >= item.stock}
                      onClick={() => increment(item.productId)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="space-y-3 border-t p-4">
        {/* Método de pago */}
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPaymentMethod(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors",
                paymentMethod === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              <opt.icon className="size-4" />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Descuento</span>
          <Input
            type="number"
            min={0}
            value={discount || ""}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            placeholder="0"
            className="h-8 w-28 text-right tabular-nums"
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>

        <Button
          className="h-12 w-full text-base"
          disabled={empty || checkingOut}
          onClick={onCheckout}
        >
          {checkingOut && <Loader2 className="size-5 animate-spin" />}
          Cobrar {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}
