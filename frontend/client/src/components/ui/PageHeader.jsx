import React from "react";

/**
 * PageHeader – Consistent page-level header for every page.
 *
 * Props:
 *   title        string    – page title
 *   actionLabel  string    – primary action button label (e.g. "+ New Vehicle")
 *   onAction     function  – callback for primary action
 *   search       string    – search value
 *   onSearch     function  – search change handler
 *   searchPlaceholder string
 *   sortOptions  Array<{label, value}>
 *   sortValue    string
 *   onSort       function
 *   groupOptions Array<{label, value}>
 *   groupValue   string
 *   onGroup      function
 */
function PageHeader({
    title,
    actionLabel,
    onAction,
    search = "",
    onSearch,
    searchPlaceholder = "Search…",
    sortOptions = [],
    sortValue = "",
    onSort,
    groupOptions = [],
    groupValue = "",
    onGroup,
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
            }}
        >
            {/* Left: Title + Action */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                    {title}
                </h2>
                {actionLabel && (
                    <button
                        onClick={onAction}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "7px 14px",
                            background: "#1d4ed8",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            boxShadow: "0 1px 2px rgba(29,78,216,0.25)",
                        }}
                    >
                        <span style={{ fontSize: "16px", lineHeight: "1" }}>+</span>
                        {actionLabel}
                    </button>
                )}
            </div>

            {/* Right: Search + Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {/* Search */}
                {onSearch && (
                    <div style={{ position: "relative" }}>
                        <svg
                            width="15" height="15" viewBox="0 0 15 15"
                            fill="none" aria-hidden="true"
                            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                        >
                            <circle cx="6.5" cy="6.5" r="5" stroke="#94a3b8" strokeWidth="1.4" />
                            <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            aria-label="Search"
                            style={{
                                paddingLeft: "32px",
                                paddingRight: "10px",
                                height: "34px",
                                width: "210px",
                                fontSize: "0.8125rem",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                background: "#fff",
                                outline: "none",
                            }}
                        />
                    </div>
                )}

                {/* Group By */}
                {groupOptions.length > 0 && (
                    <select
                        value={groupValue}
                        onChange={(e) => onGroup && onGroup(e.target.value)}
                        aria-label="Group by"
                        style={{
                            height: "34px",
                            padding: "0 30px 0 10px",
                            fontSize: "0.8125rem",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            background: "#fff",
                            color: "#475569",
                            cursor: "pointer",
                            minWidth: "130px",
                        }}
                    >
                        <option value="">Group by…</option>
                        {groupOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                )}

                {/* Sort */}
                {sortOptions.length > 0 && (
                    <select
                        value={sortValue}
                        onChange={(e) => onSort && onSort(e.target.value)}
                        aria-label="Sort by"
                        style={{
                            height: "34px",
                            padding: "0 30px 0 10px",
                            fontSize: "0.8125rem",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            background: "#fff",
                            color: "#475569",
                            cursor: "pointer",
                            minWidth: "130px",
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
