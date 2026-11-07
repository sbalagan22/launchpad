import type { ReactNode } from "react";
import { cx } from "./primitives";

/** Grid-based table matching the design: surface header row, 1px dividers, horizontal scroll on small screens. */
export function Table({ columns, heads, minWidth = 560, children, label }: { columns: string; heads: string[]; minWidth?: number; children: ReactNode; label: string }) {
  return (
    <div className="border border-line rounded-card overflow-x-auto bg-white">
      <div role="table" aria-label={label} style={{ minWidth }}>
        <div role="row" style={{ gridTemplateColumns: columns }} className="grid gap-4 px-6 py-2 bg-surface border-b border-line text-xs font-medium">
          {heads.map((h) => (
            <span key={h} role="columnheader">
              {h}
            </span>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

export function TableRow({ columns, children, onClick, href, className }: { columns: string; children: ReactNode; onClick?: () => void; href?: string; className?: string }) {
  const base = cx("grid gap-4 px-6 py-4 items-center text-sm border-t border-line first:border-t-0", (onClick || href) && "cursor-pointer hover:bg-surface transition-colors", className);
  if (onClick)
    return (
      <div role="row" tabIndex={0} onClick={onClick} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())} style={{ gridTemplateColumns: columns }} className={base}>
        {children}
      </div>
    );
  return (
    <div role="row" style={{ gridTemplateColumns: columns }} className={base}>
      {children}
    </div>
  );
}
