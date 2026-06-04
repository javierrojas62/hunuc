import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Receipt,
  Users,
  ScrollText,
} from "lucide-react";
import type { Permission } from "@/lib/rbac/permissions";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Permiso requerido para ver el ítem (undefined = visible para todos). */
  permission?: Permission;
  /** Coincidencia exacta de ruta (para el item de inicio). */
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { title: "Inicio", href: "/", icon: LayoutDashboard, exact: true },
      { title: "Vender (POS)", href: "/pos", icon: ShoppingCart, permission: "sales:create" },
      { title: "Productos", href: "/products", icon: Package, permission: "products:read" },
      { title: "Ventas", href: "/sales", icon: Receipt, permission: "sales:read:own" },
      { title: "Caja", href: "/cash", icon: Wallet, permission: "cash:read" },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Usuarios", href: "/admin/users", icon: Users, permission: "users:manage" },
      { title: "Auditoría", href: "/admin/audit", icon: ScrollText, permission: "audit:read" },
    ],
  },
];
