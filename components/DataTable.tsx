'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface Props<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  searchColumn?: string;
  onExport?: () => void;
  globalFilter?: string;
}

export default function DataTable<T>({
  data,
  columns,
  pageSize = 20,
  onExport,
  globalFilter,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const { pageIndex, pageSize: ps } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pageIndex * ps + 1;
  const endRow = Math.min(startRow + ps - 1, totalRows);

  return (
    <div className="flex flex-col gap-3">
      {onExport && (
        <div className="flex justify-end">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#141414] border border-[#262626] rounded-md text-[#a3a3a3] hover:text-[#fafafa] hover:border-[#333333] transition-colors"
          >
            <Download size={13} />
            Exportar CSV
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[#262626]">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#737373] bg-[#0a0a0a] whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-[#333333]">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp size={12} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronsUpDown size={12} />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-[#737373] text-sm"
                >
                  Sem dados qualificados para esse filtro
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#1c1c1c] hover:bg-[#141414] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-[#a3a3a3] whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalRows > ps && (
        <div className="flex items-center justify-between text-xs text-[#737373]">
          <span>{startRow}–{endRow} de {totalRows}</span>
          <div className="flex gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded border border-[#262626] hover:border-[#333333] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded border border-[#262626] hover:border-[#333333] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
