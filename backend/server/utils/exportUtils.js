export function generateCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';

    const escape = (val) => {
        const str = val === null || val === undefined ? '' : String(val);
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

export { generateCSV as default };
