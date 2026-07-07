"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query/keys";
import { categorySchema, type CategoryInput } from "../schemas";
import { createCategoryAction, updateCategoryAction } from "../actions";
import type { CategoryRow } from "../api";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEFAULT_VALUES: CategoryInput = {
  name: "",
  slug: "",
  color: "#6b7280",
};

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryRow | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(category);
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryInput>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      setSlugTouched(isEdit);
      form.reset(
        category
          ? {
              name: category.name,
              slug: category.slug,
              color: category.color,
            }
          : DEFAULT_VALUES,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  async function onSubmit(values: CategoryInput) {
    const res = isEdit
      ? await updateCategoryAction(category!.id, values)
      : await createCategoryAction(values);

    if (!res.ok) {
      toast.error(res.error ?? "Error al guardar");
      return;
    }
    toast.success(isEdit ? "Categoría actualizada" : "Categoría creada");
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modificá los datos de la categoría."
              : "Creá una categoría para clasificar productos."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Almacén"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!slugTouched) {
                          form.setValue("slug", slugify(e.target.value), {
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="almacen"
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="color"
                        className="h-9 w-14 p-1"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="#6b7280"
                      className="flex-1"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
