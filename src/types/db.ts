import type { Database } from "./database.types";

/** Atajos para filas de tablas: Row<"products"> */
export type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];

// Aliases de dominio más legibles
export type Product = Row<"products">;
export type Category = Row<"categories">;
export type Producer = Row<"producers">;
export type Profile = Row<"profiles">;
export type Branch = Row<"branches">;
export type Sale = Row<"sales">;
export type SaleItem = Row<"sale_items">;
export type CashRegister = Row<"cash_registers">;
export type CashMovement = Row<"cash_movements">;
export type StockMovement = Row<"stock_movements">;
export type AuditLog = Row<"audit_logs">;
export type Session = Row<"sessions">;

/** Producto con sus relaciones expandidas (joins típicos en listados). */
export type ProductWithRelations = Product & {
  category: Pick<Category, "id" | "name" | "slug" | "color"> | null;
  producer: Pick<Producer, "id" | "name"> | null;
};
