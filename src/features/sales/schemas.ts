import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

export const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "La venta no tiene productos"),
  payment_method: z.enum([
    PAYMENT_METHODS.CASH,
    PAYMENT_METHODS.TRANSFER,
    PAYMENT_METHODS.MERCADO_PAGO,
  ]),
  discount: z.number().nonnegative().default(0),
  note: z.string().max(300).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
