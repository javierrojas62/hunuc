/** Constantes de dominio. Fuente única de verdad para enums del negocio. */

export const ROLES = {
  ADMIN: "admin",
  SELLER: "seller",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Métodos de pago observados en la planilla real (EFEC / MP / TRANS). */
export const PAYMENT_METHODS = {
  CASH: "efectivo",
  TRANSFER: "transferencia",
  MERCADO_PAGO: "mercado_pago",
} as const;
export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercado_pago: "Mercado Pago",
};

/** Mapeo de los códigos del Excel a métodos normalizados. */
export const PAYMENT_METHOD_ALIASES: Record<string, PaymentMethod> = {
  EFEC: "efectivo",
  EFECTIVO: "efectivo",
  TRANS: "transferencia",
  TRANSFERENCIA: "transferencia",
  MP: "mercado_pago",
  "MERCADO PAGO": "mercado_pago",
};

export const STOCK_MOVEMENT_TYPES = {
  IN: "in",
  OUT: "out",
  ADJUST: "adjust",
  SALE: "sale",
} as const;
export type StockMovementType =
  (typeof STOCK_MOVEMENT_TYPES)[keyof typeof STOCK_MOVEMENT_TYPES];

export const CASH_MOVEMENT_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
  SALE: "sale",
} as const;
export type CashMovementType =
  (typeof CASH_MOVEMENT_TYPES)[keyof typeof CASH_MOVEMENT_TYPES];

export const CASH_REGISTER_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
} as const;

export const SALE_STATUS = {
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

/** Unidades base normalizadas para el importador. */
export const BASE_UNITS = {
  UNIT: "unidad",
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITER: "ml",
  LITER: "l",
} as const;
export type BaseUnit = (typeof BASE_UNITS)[keyof typeof BASE_UNITS];

export const LOW_STOCK_DEFAULT_THRESHOLD = 5;

export const CURRENCY = {
  locale: "es-AR",
  code: "ARS",
} as const;
