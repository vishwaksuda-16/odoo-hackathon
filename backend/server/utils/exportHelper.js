export const convertToCSV = (data) => {
    const headers = ["Vehicle ID", "Model", "Odometer", "Total Maint", "Total Fuel", "ROI"];
    const rows = data.map(v => [
        v.id, v.name_model, v.odometer, v.total_maintenance, v.total_fuel, v.roi
    ]);
    return [headers, ...rows].map(e => e.join(",")).join("\n");
};