"use client";

import { useState } from "react";
import { Search, PackageX, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuickSearch } from "@/features/products/hooks";
import type { ProductViewRow } from "@/features/products/api";
import { formatCurrency } from "@/lib/format";

export function PosSearch({ onSelect }: { onSelect: (p: ProductViewRow) => void }) {
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 200);
  const { data, isFetching } = useQuickSearch(debounced);

  function selectAndReset(p: ProductViewRow) {
    onSelect(p);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar producto por nombre o código…"
          className="h-12 pl-10 text-base"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && data && data.length === 1) {
              selectAndReset(data[0]);
            }
          }}
        />
      </div>

      <ScrollArea className="flex-1 rounded-lg border">
        {isFetching && !data ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !debounced ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Search className="size-8" />
            <p className="text-sm">Empezá a escribir para buscar productos</p>
          </div>
        ) : data && data.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <PackageX className="size-8" />
            <p className="text-sm">Sin resultados para “{debounced}”</p>
          </div>
        ) : (
          <ul className="divide-y">
            {data?.map((p) => {
              const noStock = Number(p.stock) <= 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={noStock}
                    onClick={() => selectAndReset(p)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium leading-tight">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.code || "—"} · {p.unit_label} · stock {Number(p.stock)}
                      </p>
                    </div>
                    <span className="tabular-nums font-semibold">
                      {formatCurrency(Number(p.price))}
                    </span>
                    {noStock ? (
                      <Badge variant="destructive" className="text-[10px]">sin stock</Badge>
                    ) : (
                      <Plus className="size-4 text-primary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
