export const checkCargoFit = (cargoWeight, vehicleMax) => {
    if (parseFloat(cargoWeight) > parseFloat(vehicleMax)) {
        return { 
            allowed: false, 
            message: `Cargo too heavy! Max: ${vehicleMax}kg` 
        };
    }
    return { allowed: true };
};