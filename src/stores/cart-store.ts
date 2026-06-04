import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentMethod } from "@/lib/constants";

export interface CartItem {
  productId: string;
  code: string;
  name: string;
  unitLabel: string;
  price: number;
  stock: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  note: string;
  discount: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNote: (note: string) => void;
  setDiscount: (discount: number) => void;
  clear: () => void;
  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
}

/**
 * Carrito del POS. Estado efímero de UI (Zustand), persistido en localStorage
 * para no perder la venta en curso ante un refresh accidental.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      paymentMethod: "efectivo",
      note: "",
      discount: 0,
      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: qty }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      setQuantity: (productId, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
            .filter((i) => i.quantity > 0),
        })),
      increment: (productId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        })),
      decrement: (productId) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setNote: (note) => set({ note }),
      setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
      clear: () =>
        set({ items: [], note: "", paymentMethod: "efectivo", discount: 0 }),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      total: () => Math.max(0, get().subtotal() - get().discount),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "hunuc-pos-cart" },
  ),
);
