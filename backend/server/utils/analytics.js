// Metric: Fuel Efficiency (km / L) [cite: 44]
export const calculateFuelEfficiency = (kilometers, liters) => {
    return liters > 0 ? (kilometers / liters).toFixed(2) : 0;
};

// Metric: Vehicle ROI [cite: 45]
// Formula: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
export const calculateVehicleROI = (revenue, maintenanceCost, fuelCost, acquisitionCost = 50000) => {
    const totalOpsCost = parseFloat(maintenanceCost) + parseFloat(fuelCost);
    const profit = revenue - totalOpsCost;
    return acquisitionCost > 0 ? (profit / acquisitionCost).toFixed(4) : 0;
};

// Unique Feature: Risk Engine Score
export const calculateSafetyRisk = (driverScore, odometer) => {
    let risk = 0;
    if (driverScore < 70) risk += 40;
    if (odometer > 200000) risk += 30;
    return {
        score: risk,
        level: risk > 50 ? 'High Risk' : risk > 20 ? 'Moderate' : 'Safe'
    };
};