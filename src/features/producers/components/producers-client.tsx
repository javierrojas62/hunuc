"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryKeys } from "@/lib/query/keys";
import { useProducersManage } from "../hooks";
import { deleteProducerAction } from "../actions";
import type { ProducerRow } from "../api";
import { ProducerFormDialog } from "./producer-form-dialog";

export function ProducersClient() {
  const queryClient = useQueryClient();
  const { data: producers, isLoading } = useProducersManage();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProducerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProducerRow | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.producers.all });

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await deleteProducerAction(deleteTarget.id);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo eliminar");
    } else {
      toast.success("Productor eliminado");
      invalidate();
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Productores"
        description="Administrá los productores asociados a los productos."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Nuevo productor
          </Button>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Productor</TableHead>
              <TableHead>Prefijo</TableHead>
              <TableHead className="text-right">Productos</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : producers?.length ? (
              producers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.code_prefix ? <Badge variant="outline">{p.code_prefix}</Badge> : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.product_count}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No hay productores.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProducerFormDialog open={formOpen} onOpenChange={setFormOpen} producer={editing} />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar productor?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.name}</strong>.
              {deleteTarget && deleteTarget.product_count > 0
                ? ` ${deleteTarget.product_count} producto(s) quedarán sin productor.`
                : ""}{" "}
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
