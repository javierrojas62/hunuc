/**
 * Query keys centralizadas. Evita strings mágicos y facilita invalidaciones
 * consistentes desde Server Actions / mutations.
 */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters?: unknown) =>
      ["products", "list", filters ?? {}] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    lowStock: ["products", "low-stock"] as const,
    search: (term: string) => ["products", "search", term] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  producers: {
    all: ["producers"] as const,
  },
  sales: {
    all: ["sales"] as const,
    list: (filters?: unknown) =>
      ["sales", "list", filters ?? {}] as const,
    detail: (id: string) => ["sales", "detail", id] as const,
    today: ["sales", "today"] as const,
    byUser: (userId: string) => ["sales", "by-user", userId] as const,
    topProducts: ["sales", "top-products"] as const,
  },
  cash: {
    all: ["cash"] as const,
    current: ["cash", "current"] as const,
    movements: (registerId: string) =>
      ["cash", "movements", registerId] as const,
    history: ["cash", "history"] as const,
  },
  dashboard: {
    metrics: (range: string) => ["dashboard", "metrics", range] as const,
    recentActivity: ["dashboard", "recent-activity"] as const,
    topSellers: ["dashboard", "top-sellers"] as const,
  },
  audit: {
    list: (filters?: unknown) =>
      ["audit", "list", filters ?? {}] as const,
  },
  users: {
    all: ["users"] as const,
  },
} as const;
