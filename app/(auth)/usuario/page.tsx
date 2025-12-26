"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { TableCompleteComponent } from "@/components/table";
import { fuzzyFilter } from "@/components/table/utils/fuzzy-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteUserDialog } from "./_components/delete-user-dialog";
import { useUserDeleteMutation } from "./_components/services/use-user-delete.mutation";
import { useUsersListQuery } from "./_components/services/use-users-list.query";

type User = NonNullable<ReturnType<typeof useUsersListQuery>["data"]>[number];

const columnHelper = createColumnHelper<User>();

const stateLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "Activo", variant: "default" },
  suspended: { label: "Suspendido", variant: "secondary" },
  banned: { label: "Bloqueado", variant: "destructive" },
  pending_verification: { label: "Pendiente", variant: "outline" },
};

export default function UsersPage() {
  const usersQuery = useUsersListQuery();
  const deleteMutation = useUserDeleteMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "numero",
        header: "N°",
        size: 50,
        cell: ({ row }) => row.index + 1,
      }),
      columnHelper.accessor("name", {
        header: "Nombre",
        size: 250,
      }),
      columnHelper.accessor("short_name", {
        header: "Nombre Corto",
        size: 150,
        cell: ({ getValue }) => getValue() || "-",
      }),
      columnHelper.accessor("role", {
        header: "Rol",
        size: 120,
        cell: ({ getValue }) => {
          const role = getValue();
          return (
            <Badge variant={role.name === "admin" ? "default" : "secondary"}>
              {role.name === "admin" ? "Administrador" : "Jugador"}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("state", {
        header: "Estado",
        size: 120,
        cell: ({ getValue }) => {
          const state = getValue();
          const config = stateLabels[state];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      }),
      columnHelper.accessor("creation_date", {
        header: "Fecha de Creación",
        size: 180,
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        size: 150,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link href={`/usuario/${row.original.id}/editar`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => {
                setSelectedUser(row.original);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        ),
      }),
    ],
    [],
  );

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra los usuarios del sistema
            </p>
          </div>
          <Link href="/usuario/nuevo">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </Button>
          </Link>
        </div>

        {/* Mutation Status Handler */}
        <MutationStatusHandler mutations={[deleteMutation]}>
          {/* Delete Confirmation Dialog */}
          <DeleteUserDialog
            open={deleteDialogOpen}
            setOpen={setDeleteDialogOpen}
            user={selectedUser}
          />

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                Todos los usuarios registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QueryStatusHandler queries={[usersQuery]}>
                <TableCompleteComponent
                  tableOptions={{
                    data: usersQuery.data ?? [],
                    columns,
                    getCoreRowModel: getCoreRowModel(),
                    getPaginationRowModel: getPaginationRowModel(),
                    getSortedRowModel: getSortedRowModel(),
                    getFilteredRowModel: getFilteredRowModel(),
                    filterFns: {
                      fuzzy: fuzzyFilter,
                    },
                  }}
                  search={{
                    show: true,
                    searchParamKey: "searchUsers",
                  }}
                  footer={{
                    showPagination: true,
                    showSelectedRows: false,
                  }}
                />
              </QueryStatusHandler>
            </CardContent>
          </Card>
        </MutationStatusHandler>
      </div>
    </div>
  );
}
