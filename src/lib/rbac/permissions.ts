import { ROLES, type Role } from "@/lib/constants";

/** Acciones granulares del sistema. */
export type Permission =
  | "products:read"
  | "products:write"
  | "products:price:write"
  | "products:import"
  | "sales:create"
  | "sales:read:own"
  | "sales:read:all"
  | "cash:operate"
  | "cash:read"
  | "dashboard:seller"
  | "dashboard:admin"
  | "profit:read"
  | "users:manage"
  | "audit:read";

const SELLER_PERMISSIONS: Permission[] = [
  "products:read",
  "sales:create",
  "sales:read:own",
  "cash:read",
  "dashboard:seller",
];

/** Admin hereda todo lo del vendedor + capacidades administrativas. */
const ADMIN_PERMISSIONS: Permission[] = [
  ...SELLER_PERMISSIONS,
  "products:write",
  "products:price:write",
  "products:import",
  "sales:read:all",
  "cash:operate",
  "dashboard:admin",
  "profit:read",
  "users:manage",
  "audit:read",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.SELLER]: SELLER_PERMISSIONS,
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === ROLES.ADMIN;
}
