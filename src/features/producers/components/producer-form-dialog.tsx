"use client";

import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query/keys";
import { producerSchema, type ProducerInput } from "../schemas";
import { createProducerAction, updateProducerAction } from "../actions";
import type { ProducerRow } from "../api";

const DEFAULT_VALUES: ProducerInput = {
  name: "",
  code_prefix: undefined,
  notes: undefined,
};

interface ProducerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producer?: ProducerRow | null;
}

export function ProducerFormDialog({
  open,
  onOpenChange,
  producer,
}: ProducerFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(producer);

  const form = useForm<ProducerInput>({
    resolver: zodResolver(producerSchema) as Resolver<ProducerInput>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        producer
          ? {
              name: producer.name,
              code_prefix: producer.code_prefix ?? undefined,
              notes: producer.notes ?? undefined,
            }
          : DEFAULT_VALUES,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, producer]);

  async function onSubmit(values: ProducerInput) {
    const res = isEdit
      ? await updateProducerAction(producer!.id, values)
      : await createProducerAction(values);

    if (!res.ok) {
      toast.error(res.error ?? "Error al guardar");
      return;
    }
    toast.success(isEdit ? "Productor actualizado" : "Productor creado");
    queryClient.invalidateQueries({ queryKey: queryKeys.producers.all });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar productor" : "Nuevo productor"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modificá los datos del productor."
              : "Creá un productor para asociarlo a los productos."}
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
                    <Input placeholder="Vilma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code_prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefijo</FormLabel>
                  <FormControl>
                    <Input placeholder="VILMA" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
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
