"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/query/keys";
import { formatDate } from "@/lib/format";
import { ROLES } from "@/lib/constants";
import { useUsers } from "../hooks";
import { setUserRoleAction, toggleUserActiveAction } from "../actions";
import { CreateUserDialog } from "./create-user-dialog";

export function UsersClient({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

  async function changeRole(id: string, role: "admin" | "seller") {
    const res = await setUserRoleAction(id, role);
    if (!res.ok) return toast.error(res.error ?? "Error");
    toast.success("Rol actualizado");
    invalidate();
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await toggleUserActiveAction(id, active);
    if (!res.ok) return toast.error(res.error ?? "Error");
    toast.success(active ? "Usuario activado" : "Usuario desactivado");
    invalidate();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuarios"
        description="Gestioná vendedores y administradores."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus /> Nuevo usuario
          </Button>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead className="text-right">Activo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users?.length ? (
              users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.full_name || "—"}
                      {isSelf && <Badge variant="secondary" className="ml-2 text-[10px]">vos</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground">{u.branch_name ?? "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => changeRole(u.id, v as "admin" | "seller")}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ROLES.SELLER}>Vendedor</SelectItem>
                          <SelectItem value={ROLES.ADMIN}>Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={u.is_active}
                        disabled={isSelf}
                        onCheckedChange={(c) => toggleActive(u.id, c)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
