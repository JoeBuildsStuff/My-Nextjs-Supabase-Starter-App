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
  getGroupedRowModel,
  getExpandedRowModel,
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
import { cn } from "@/lib/utils"
import { ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"


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
  const [grouping, setGrouping] = React.useState<string[]>([])

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
      grouping,
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
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    enableExpanding: true,
  })

  return (
    <div className="space-y-2">
      <DataTableToolbar table={table} />
      <div className="rounded-md border w-fit">
        <Table className="w-fit">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
                        position: "relative",
                        whiteSpace: "nowrap"
                      }}
                      className="border-r"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-accent active:bg-accent",
                            header.column.getIsResizing() && "bg-accent"
                          )}
                        />
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
                    <TableCell 
                      key={cell.id} 
                      className={cn(
                        "border-r",
                        cell.getIsGrouped() && "bg-muted/50",
                        cell.getIsAggregated() && "bg-muted/20"
                      )}
                    >
                      {cell.getIsGrouped() ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={row.getToggleExpandedHandler()}
                          >
                            {row.getIsExpanded() ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}{' '}
                          ({row.subRows.length})
                        </div>
                      ) : cell.getIsAggregated() ? (
                        flexRender(
                          cell.column.columnDef.aggregatedCell ?? 
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      ) : cell.getIsPlaceholder() ? null : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
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
