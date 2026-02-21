import React from "react";

/**
 * PageHeader – Consistent page-level header for every page.
 *
 * Props:
 *   title            – Page heading
 *   actionLabel      – Primary action button text (optional)
 *   onAction         – Callback for primary action
 *   search / onSearch / searchPlaceholder
 *   groupOptions / groupValue / onGroup
 *   sortOptions / sortValue / onSort
 */
function PageHeader({
    title,
    actionLabel,
    onAction,
    search,
    onSearch,
    searchPlaceholder = "Search…",
    groupOptions,
    groupValue,
    onGroup,
    sortOptions,
    sortValue,
    onSort,
}) {
    return (
        <div style={{ marginBottom: "18px" }}>
            {/* Top row: title + action */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{title}</h2>
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        id={`action-${title.replace(/\s+/g, "-").toLowerCase()}`}
                        style={{
                            padding: "9px 18px",
                            background: "var(--color-primary)",
                            color: "var(--color-surface)",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span> {actionLabel}
                    </button>
                )}
            </div>

            {/* Controls row: search + group-by + sort */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* Search */}
                {onSearch && (
                    <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "320px" }}>
                        <svg
                            width="14" height="14" viewBox="0 0 14 14" fill="none"
                            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
                        >
                            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                            <line x1="9" y1="9" x2="12" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                        <input
                            type="search"
                            value={search || ""}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder}
                            style={{
                                width: "100%",
                                padding: "8px 12px 8px 30px",
                                border: "1px solid var(--color-border)",
                                borderRadius: "6px",
                                fontSize: "0.875rem",
                                background: "var(--color-surface)",
                                color: "var(--color-text-primary)",
                            }}
                        />
                    </div>
                )}

                {/* Group By */}
                {groupOptions && groupOptions.length > 0 && (
                    <select
                        value={groupValue || ""}
                        onChange={(e) => onGroup && onGroup(e.target.value)}
                        aria-label="Group by"
                        style={{
                            padding: "8px 32px 8px 10px",
                            border: "1px solid var(--color-border)",
                            borderRadius: "6px",
                            fontSize: "0.8125rem",
                            background: "var(--color-surface)",
                            color: "var(--color-text-secondary)",
                            cursor: "pointer",
                        }}
                    >
                        <option value="">Group by…</option>
                        {groupOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                )}

                {/* Sort */}
                {sortOptions && sortOptions.length > 0 && (
                    <select
                        value={sortValue || ""}
                        onChange={(e) => onSort && onSort(e.target.value)}
                        aria-label="Sort by"
                        style={{
                            padding: "8px 32px 8px 10px",
                            border: "1px solid var(--color-border)",
                            borderRadius: "6px",
                            fontSize: "0.8125rem",
                            background: "var(--color-surface)",
                            color: "var(--color-text-secondary)",
                            cursor: "pointer",
                        }}
                    >
                        <option value="">Sort by…</option>
                        {sortOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}

export default PageHeader;
