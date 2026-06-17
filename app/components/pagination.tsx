"use client";

import React from "react";

export type RowsPerPage = number | "all";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalStudents: number;
  selectedRows: RowsPerPage;
  onPrev: () => void;
  onNext: () => void;
  onRowsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const ROWS_PER_PAGE: RowsPerPage[] = [5, 10, 20, "all"];

export function Pagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalStudents,
  selectedRows,
  onPrev,
  onNext,
  onRowsChange,
}: PaginationProps) {
  const safeStart = isNaN(startIndex) ? 0 : startIndex;
  const safeEnd = isNaN(endIndex) ? totalStudents : endIndex;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 w-full">
      <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
        Showing <span className="font-semibold">{safeStart + 1}</span>–
        <span className="font-semibold">
          {Math.min(safeEnd, totalStudents)}
        </span>{" "}
        of {totalStudents} students
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700">
            Rows per page:
          </label>
          <select
            value={selectedRows}
            onChange={(e) => {
              e.stopPropagation();
              onRowsChange(e);
            }}
            className="px-2 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0E4BA9] text-black"
          >
            {ROWS_PER_PAGE.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All" : option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onPrev}
            disabled={currentPage === 1}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#0E4BA9] text-white hover:bg-blue-700"
            }`}
          >
            Prev
          </button>
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            {currentPage}/{totalPages}
          </span>
          <button
            onClick={onNext}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#0E4BA9] text-white hover:bg-blue-700"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
