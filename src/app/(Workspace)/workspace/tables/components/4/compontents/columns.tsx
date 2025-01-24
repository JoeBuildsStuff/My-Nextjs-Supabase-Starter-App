"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

import { Task } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

//create default size for columns
const defaultSizeTiny = 50
const defaultSizeSmall = 100
const defaultSizeMedium = 150
// const defaultSizeLarge = 200
const defaultSizeXLarge = 350

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    size: defaultSizeTiny,

    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    size: defaultSizeTiny,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
    cell: ({ row }) => <div className="w-fit">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "title",
    size: defaultSizeXLarge,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
    cell: ({ row }) => <div className="w-fit">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "status",
    size: defaultSizeMedium,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
    cell: ({ row }) => <div className="w-fit">{row.getValue("status")}</div>,
  },
  {
    accessorKey: "priority",
    size: defaultSizeMedium,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
    cell: ({ row }) => <div className="w-fit">{row.getValue("priority")}</div>,
  },
  {
    id: "actions",
    size: defaultSizeSmall,
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
