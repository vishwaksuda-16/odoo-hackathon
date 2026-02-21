/**
 * Generates a RFC-4180 compliant CSV string from an array of flat objects.
 * Handles values that contain commas, quotes, or newlines.
 */
export function generateCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';

    const escape = (val) => {
        const str = val === null || val === undefined ? '' : String(val);
        // Wrap in quotes if the value contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headers = Object.keys(data[0]);
    const headerRow = headers.map(escape).join(',');
    const dataRows = data.map(row =>
        headers.map(h => escape(row[h])).join(',')
    );

    return [headerRow, ...dataRows].join('\r\n');
}

// Alias kept for any code that imports generateCSV from exportUtils
export { generateCSV as default };
