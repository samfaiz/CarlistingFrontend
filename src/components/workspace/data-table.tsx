/**
 * DataTable + StatCard + FilterBar — the internal-surface primitives from
 * INTERNAL-SURFACES-DESIGN §3, promoted out of the prototype.
 *
 * Operator-grade on purpose: 13px type, 40px rows, real table semantics, and
 * every list paginates. The seeded dataset is ~97,500 listings and an unbounded
 * query already caused a production-class 500 once (P2 defect #2), so "load
 * everything" is not an option these components offer.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { AlertTriangle, ArrowDown, ArrowUp, Inbox, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "up" | "down";
}) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
      {hint && (
        <p
          className={cn(
            "mt-0.5 text-xs font-semibold",
            tone === "up" && "text-success-strong",
            tone === "down" && "text-danger-strong",
            tone === "neutral" && "text-muted",
          )}
        >
          {hint}
        </p>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* FilterBar                                                           */
/* ------------------------------------------------------------------ */

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterBar({
  search,
  onSearch,
  options,
  active,
  onSelect,
  children,
}: {
  search?: string;
  onSearch?: (value: string) => void;
  options?: FilterOption[];
  active?: string;
  onSelect?: (value: string) => void;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {onSearch && (
        <span className="relative">
          <Search
            className="pointer-events-none absolute inset-block-0 start-2 my-auto size-4 text-muted"
            aria-hidden
          />
          <Input
            className="h-9 w-56 ps-8"
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("actions.search", { defaultValue: "Search…" })}
            aria-label={t("actions.search", { defaultValue: "Search" })}
          />
        </span>
      )}
      {options?.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={active === option.value ? "primary" : "outline"}
          aria-pressed={active === option.value}
          onClick={() => onSelect?.(option.value)}
        >
          {option.label}
        </Button>
      ))}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DataTable                                                           */
/* ------------------------------------------------------------------ */

export interface Column<Row> {
  key: string;
  header: string;
  align?: "start" | "end";
  /** Marks the cell that names the row — rendered as a row header for a11y. */
  isRowHeader?: boolean;
  sortable?: boolean;
  render: (row: Row) => React.ReactNode;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  caption: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: { title: string; hint?: string; action?: React.ReactNode };
  sort?: { key: string; direction: "asc" | "desc" };
  onSort?: (key: string) => void;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    onChange: (offset: number) => void;
  };
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  caption,
  loading,
  error,
  onRetry,
  empty,
  sort,
  onSort,
  pagination,
}: DataTableProps<Row>) {
  const { t } = useTranslation("common");

  if (error) {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <AlertTriangle className="size-6 text-warning-strong" aria-hidden />
        <p className="text-sm text-ink">{error}</p>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            {t("actions.retry", { defaultValue: "Retry" })}
          </Button>
        )}
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="flex items-center gap-2 p-6 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("states.loading", { defaultValue: "Loading…" })}
      </Card>
    );
  }

  if (rows.length === 0 && empty) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <Inbox className="size-7 text-muted" aria-hidden />
        <p className="text-sm font-bold text-ink">{empty.title}</p>
        {empty.hint && <p className="max-w-sm text-xs text-muted">{empty.hint}</p>}
        {empty.action}
      </Card>
    );
  }

  const pages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;
  const page = pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1;

  return (
    <>
      {/* The table scrolls inside its own container — the page body never
          scrolls sideways (INTERNAL-SURFACES-DESIGN §7). */}
      <div className="overflow-x-auto rounded-card border border-line bg-card">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-brand text-white">
              {columns.map((column) => {
                const sorted = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sorted
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : column.sortable
                          ? "none"
                          : undefined
                    }
                    className={cn(
                      "p-2.5 font-semibold",
                      column.align === "end" ? "text-end" : "text-start",
                    )}
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {column.header}
                        {sorted &&
                          (sort.direction === "asc" ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden />
                          ))}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={rowKey(row)} className={cn("h-10", index % 2 === 1 && "bg-page")}>
                {columns.map((column) =>
                  column.isRowHeader ? (
                    <th
                      key={column.key}
                      scope="row"
                      className="border-b border-divider p-2.5 text-start font-medium text-ink"
                    >
                      {column.render(row)}
                    </th>
                  ) : (
                    <td
                      key={column.key}
                      className={cn(
                        "border-b border-divider p-2.5 text-ink",
                        column.align === "end" ? "text-end" : "text-start",
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pages > 1 && (
        <nav
          className="mt-3 flex items-center justify-between gap-3"
          aria-label={t("pagination.label", { defaultValue: "Pagination" })}
        >
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.offset === 0}
            onClick={() =>
              pagination.onChange(Math.max(0, pagination.offset - pagination.limit))
            }
          >
            {t("pagination.previous", { defaultValue: "Previous" })}
          </Button>
          <span className="text-xs text-muted">
            {t("pagination.pageOf", {
              page,
              pages,
              defaultValue: `Page ${page} of ${pages}`,
            })}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.offset + pagination.limit >= pagination.total}
            onClick={() => pagination.onChange(pagination.offset + pagination.limit)}
          >
            {t("pagination.next", { defaultValue: "Next" })}
          </Button>
        </nav>
      )}
    </>
  );
}
