"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/shared/combobox";
import { queryKeys } from "@/lib/query/keys";
import { normalizeUnit } from "@/lib/units";
import { productSchema, type ProductInput } from "../schemas";
import {
  createProductAction,
  updateProductAction,
  adjustStockAction,
} from "../actions";
import { useCategories, useProducers } from "../hooks";
import type { ProductViewRow } from "../api";

const NONE = "__none__";

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductViewRow | null;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
}: ProductFormSheetProps) {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: producers } = useProducers();
  const isEdit = Boolean(product);

  const form = useForm<ProductInput>({
    // El cast evita la divergencia de tipos input/output del schema (defaults/coerce).
    resolver: zodResolver(productSchema) as Resolver<ProductInput>,
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category_id: null,
      producer_id: null,
      unit_label: "Unidad",
      unit_value: null,
      unit_base: "unidad",
      price: 0,
      cost: 0,
      stock: 0,
      min_stock: 5,
      barcode: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        product
          ? {
              code: product.code ?? "",
              name: product.name,
              description: product.description ?? "",
              category_id: product.category_id,
              producer_id: product.producer_id,
              unit_label: product.unit_label ?? "Unidad",
              unit_value: product.unit_value,
              unit_base: product.unit_base ?? "unidad",
              price: Number(product.price),
              cost: Number(product.cost),
              stock: Number(product.stock),
              min_stock: Number(product.min_stock),
              barcode: product.barcode ?? "",
              is_active: product.is_active,
            }
          : form.formState.defaultValues,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  async function onSubmit(values: ProductInput) {
    // Normalizar unidad a partir de la etiqueta ingresada
    const norm = normalizeUnit(values.unit_label);
    const payload = {
      ...values,
      unit_label: norm.label,
      unit_value: norm.value,
      unit_base: norm.base,
    };

    if (isEdit) {
      const originalStock = Number(product!.stock);
      const newStock = Number(values.stock);
      // El resto de los campos se actualiza sin tocar el stock; el cambio de
      // stock se hace por separado vía adjust_stock para que quede en el kardex.
      const res = await updateProductAction(product!.id, {
        ...payload,
        stock: originalStock,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Error al guardar");
        return;
      }
      if (newStock !== originalStock) {
        const stockRes = await adjustStockAction({
          product_id: product!.id,
          new_stock: newStock,
          reason: "Ajuste desde edición de producto",
        });
        if (!stockRes.ok) {
          toast.error(stockRes.error ?? "Error al ajustar stock");
          return;
        }
      }
    } else {
      const res = await createProductAction(payload);
      if (!res.ok) {
        toast.error(res.error ?? "Error al guardar");
        return;
      }
    }
    toast.success(isEdit ? "Producto actualizado" : "Producto creado");
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Modificá los datos del producto." : "Cargá un producto al catálogo."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-4 px-4 pb-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Harina de tomate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="HT" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <FormControl>
                      <Input placeholder="500 g" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin categoría</SelectItem>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="producer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Productor</FormLabel>
                  <Combobox
                    value={field.value ?? NONE}
                    onChange={(v) => field.onChange(v === NONE ? null : v)}
                    options={[
                      { value: NONE, label: "Sin productor" },
                      ...(producers?.map((p) => ({ value: p.id, label: p.name })) ?? []),
                    ]}
                    placeholder="Sin productor"
                    searchPlaceholder="Buscar productor…"
                    emptyText="No se encontraron productores."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio *</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    {isEdit && (
                      <p className="text-xs text-muted-foreground">
                        Si lo cambiás, el ajuste queda registrado en el kardex.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="min_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de barras</FormLabel>
                  <FormControl>
                    <Input placeholder="779…" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="m-0">Activo</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <SheetFooter className="mt-auto flex-row gap-2 px-0">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
