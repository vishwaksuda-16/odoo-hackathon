import pool from '../config/db.js';

// ─────────────────────────────────────────────────────────────────
//  Structured error response helper
// ─────────────────────────────────────────────────────────────────
const block = (res, reason, detail = null, status = 422) =>
    res.status(status).json({
        success: false,
        code: 'DISPATCH_BLOCKED',
        reason,
        ...(detail && { detail }),
    });

// ─────────────────────────────────────────────────────────────────
//  COMPLIANCE MIDDLEWARE — validateTripAssignment
//
//  Enforces all pre-dispatch rules BEFORE the controller runs.
//  Attaches { validatedVehicle, validatedDriver } to req so the
//  controller can reuse the rows without a second DB round-trip.
// ─────────────────────────────────────────────────────────────────
export const validateTripAssignment = async (req, res, next) => {
    const { vehicle_id, driver_id, cargo_weight_kg } = req.body;

    if (!vehicle_id || !driver_id || cargo_weight_kg === undefined) {
        return block(res, 'MISSING_FIELDS',
            'vehicle_id, driver_id, and cargo_weight_kg are required.', 400);
    }

    try {
        const [vehicleRes, driverRes] = await Promise.all([
            pool.query(
                `SELECT id, status, max_load_kg, vehicle_class
                 FROM vehicles WHERE id = $1 AND deleted_at IS NULL`,
                [vehicle_id]
            ),
            pool.query(
                `SELECT id, status, license_expiry, license_category, safety_score
                 FROM drivers WHERE id = $1 AND deleted_at IS NULL`,
                [driver_id]
            ),
        ]);

        // ── 1. Existence ─────────────────────────────────────────
        if (vehicleRes.rowCount === 0)
            return block(res, 'VEHICLE_NOT_FOUND', `No active vehicle with id ${vehicle_id}.`, 404);
        if (driverRes.rowCount === 0)
            return block(res, 'DRIVER_NOT_FOUND', `No active driver with id ${driver_id}.`, 404);

        const vehicle = vehicleRes.rows[0];
        const driver = driverRes.rows[0];

        // ── 2. Suspended driver ──────────────────────────────────
        if (driver.status === 'suspended')
            return block(res, 'DRIVER_SUSPENDED');

        // ── 3. Expired license ───────────────────────────────────
        if (new Date(driver.license_expiry) < new Date())
            return block(res, 'LICENSE_EXPIRED',
                `License expired on ${driver.license_expiry}.`);

        // ── 4. License category mismatch ─────────────────────────
        if (driver.license_category && vehicle.vehicle_class &&
            driver.license_category !== vehicle.vehicle_class)
            return block(res, 'LICENSE_CATEGORY_MISMATCH',
                `Driver category '${driver.license_category}' does not cover vehicle class '${vehicle.vehicle_class}'.`);

        // ── 5. Vehicle must be Available ─────────────────────────
        if (vehicle.status !== 'available') {
            const reasonMap = {
                on_trip: 'VEHICLE_ON_TRIP',
                in_shop: 'VEHICLE_IN_SHOP',
                retired: 'VEHICLE_RETIRED',
            };
            return block(res, reasonMap[vehicle.status] ?? 'VEHICLE_NOT_AVAILABLE',
                `Vehicle is '${vehicle.status}'.`);
        }

        // ── 6. Driver must be On Duty ────────────────────────────
        if (driver.status !== 'on_duty')
            return block(res, 'DRIVER_NOT_ON_DUTY',
                `Driver is '${driver.status}'.`);

        // ── 7. Cargo vs capacity ─────────────────────────────────
        if (parseFloat(cargo_weight_kg) > parseFloat(vehicle.max_load_kg))
            return block(res, 'CARGO_EXCEEDS_CAPACITY',
                `Cargo ${cargo_weight_kg}kg > vehicle max ${vehicle.max_load_kg}kg.`);

        // All clear — pass validated data to controller
        req.validatedVehicle = vehicle;
        req.validatedDriver = driver;
        next();

    } catch (error) {
        console.error('[tripValidator]', error.message);
        return res.status(500).json({
            success: false,
            code: 'INTERNAL_VALIDATION_ERROR',
            reason: error.message,
        });
    }
};