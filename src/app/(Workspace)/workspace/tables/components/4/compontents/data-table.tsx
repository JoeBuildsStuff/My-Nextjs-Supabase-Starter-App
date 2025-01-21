"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableToolbar } from "./data-table-toolbar"
import {
  useRouter,
  usePathname,
  useSearchParams
} from "next/navigation"


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse URL search params for initial sorting and filtering state
  const sortParams = searchParams.getAll('sort')
  const filterParams = searchParams.getAll('filter')
  
  const initialSorting = sortParams.map(sortParam => {
    const [id, desc] = sortParam.split(':')
    return {
      id,
      desc: desc === 'desc'
    }
  })

  const initialFilters = filterParams.map(filterParam => {
    const [id, operator, value] = filterParam.split(':')
    return {
      id,
      value: `${operator}:${value}`
    }
  })

  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters)

  // Update URL when sorting or filtering changes
  const updateUrl = React.useCallback((
    newSorting: SortingState, 
    newFilters: ColumnFiltersState
  ) => {
    const params = new URLSearchParams()
    
    // Preserve existing non-sort/filter params
    const currentParams = new URLSearchParams(window.location.search)
    currentParams.forEach((value, key) => {
      if (key !== 'sort' && key !== 'filter') {
        params.append(key, value)
      }
    })
    
    // Add sort params
    newSorting.forEach(sort => {
      const sortParam = `${sort.id}:${sort.desc ? 'desc' : 'asc'}`
      params.append('sort', sortParam)
    })

    // Add filter params
    newFilters.forEach(filter => {
      const [operator, value] = (filter.value as string).split(':')
      const filterParam = `${filter.id}:${operator}:${value}`
      params.append('filter', filterParam)
    })

    // Update URL using Next.js router
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname])

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount,
    manualSorting: true,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      updateUrl(newSorting, columnFilters)
    },
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater
      setColumnFilters(newFilters)
      updateUrl(sorting, newFilters)
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-2">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan} className="border-r">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="border-r">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
