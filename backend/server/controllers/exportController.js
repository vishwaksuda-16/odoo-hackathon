import pool from '../config/db.js';
import { generateCSV } from '../utils/exportUtils.js';
import { calculateVehicleROI, calculateFuelEfficiency } from '../utils/analytics.js';

export const downloadFinancialCSV = async (req, res) => {
    try {
        const query = `
            SELECT
                v.id,
                v.name_model,
                v.license_plate,
                v.odometer,
                COALESCE(SUM(m.cost), 0)       AS total_maintenance,
                COALESCE(SUM(f.fuel_cost), 0)  AS total_fuel,
                COALESCE(SUM(f.liters), 0)     AS total_liters
            FROM vehicles v
            LEFT JOIN maintenance_logs m ON v.id = m.vehicle_id
            LEFT JOIN fuel_logs f        ON v.id = f.vehicle_id
            GROUP BY v.id, v.name_model, v.license_plate, v.odometer
            ORDER BY v.id
        `;

        const result = await pool.query(query);

        const processedData = result.rows.map(row => ({
            vehicle_id: row.id,
            model: row.name_model,
            license_plate: row.license_plate,
            odometer_km: row.odometer,
            total_maintenance: parseFloat(row.total_maintenance).toFixed(2),
            total_fuel: parseFloat(row.total_fuel).toFixed(2),
            total_cost: (parseFloat(row.total_maintenance) + parseFloat(row.total_fuel)).toFixed(2),
            fuel_efficiency: calculateFuelEfficiency(row.odometer, row.total_liters),
            roi: calculateVehicleROI(row.odometer * 1.5, row.total_maintenance, row.total_fuel, 25000),
        }));

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=fleet_financial_report.csv');
        res.status(200).send(generateCSV(processedData));

    } catch (error) {
        console.error('[downloadFinancialCSV]', error.message);
        res.status(500).json({ error: 'Failed to generate CSV.' });
    }
};

export const downloadPayrollCSV = async (req, res) => {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    try {
        const { rows } = await pool.query(`
            SELECT
                d.id                                     AS driver_id,
                d.name,
                d.safety_score,
                COUNT(t.id) FILTER (WHERE t.status='completed')::INT AS trips_completed,
                COALESCE(SUM(
                    COALESCE(t.end_odometer,0) - COALESCE(t.start_odometer,0)
                ), 0)                                    AS total_km_driven,
                COALESCE(SUM(f.fuel_cost), 0)            AS fuel_managed_cost
            FROM drivers d
            LEFT JOIN trips t     ON t.driver_id = d.id
                AND EXTRACT(YEAR  FROM t.completed_at) = $1
                AND EXTRACT(MONTH FROM t.completed_at) = $2
            LEFT JOIN fuel_logs f ON f.trip_id = t.id
            WHERE d.deleted_at IS NULL
            GROUP BY d.id, d.name, d.safety_score
            ORDER BY trips_completed DESC
        `, [year, month]);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition',
            `attachment; filename=payroll_${year}_${String(month).padStart(2, '0')}.csv`);
        res.status(200).send(generateCSV(rows));

    } catch (error) {
        console.error('[downloadPayrollCSV]', error.message);
        res.status(500).json({ error: 'Failed to generate payroll export.' });
    }
};

export const downloadVehicleHealthCSV = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                v.id,
                v.name_model,
                v.license_plate,
                v.status,
                v.odometer,
                v.service_due_km,
                (v.odometer >= v.service_due_km)         AS maintenance_overdue,
                COUNT(m.id)::INT                          AS total_services,
                COALESCE(SUM(m.cost), 0)                 AS total_maint_cost,
                MAX(m.service_date)                      AS last_service_date,
                COUNT(t.id) FILTER (WHERE t.status='completed')::INT AS completed_trips
            FROM vehicles v
            LEFT JOIN maintenance_logs m ON m.vehicle_id = v.id
            LEFT JOIN trips t            ON t.vehicle_id = v.id
            GROUP BY v.id, v.name_model, v.license_plate,
                     v.status, v.odometer, v.service_due_km
            ORDER BY maintenance_overdue DESC, v.odometer DESC
        `);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=vehicle_health_audit.csv');
        res.status(200).send(generateCSV(rows));

    } catch (error) {
        console.error('[downloadVehicleHealthCSV]', error.message);
        res.status(500).json({ error: 'Failed to generate vehicle health CSV.' });
    }
};

export const downloadFinancialPDF = async (req, res) => {
    try {
        let PDFDocument;
        try { ({ default: PDFDocument } = await import('pdfkit')); }
        catch { return res.status(501).json({ error: 'pdfkit not installed. Run: npm install pdfkit' }); }

        const { rows } = await pool.query(`
            SELECT
                v.id, v.name_model, v.license_plate, v.odometer,
                COALESCE(SUM(m.cost), 0)       AS total_maint,
                COALESCE(SUM(f.fuel_cost), 0)  AS total_fuel
            FROM vehicles v
            LEFT JOIN maintenance_logs m ON v.id = m.vehicle_id
            LEFT JOIN fuel_logs f        ON v.id = f.vehicle_id
            GROUP BY v.id ORDER BY v.id
        `);

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=fleet_report.pdf');
        doc.pipe(res);

        doc.fontSize(18).font('Helvetica-Bold').text('Fleet Management — Financial Report', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown();

        const cols = { id: 30, model: 150, plate: 120, km: 80, maint: 90, fuel: 90 };
        const y0 = doc.y;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('ID', cols.id, y0);
        doc.text('Model', cols.model, y0);
        doc.text('Plate', cols.plate, y0);
        doc.text('KM', cols.km, y0);
        doc.text('Maint $', cols.maint, y0);
        doc.text('Fuel $', cols.fuel, y0);
        doc.moveDown(0.3);
        doc.moveTo(30, doc.y).lineTo(560, doc.y).stroke();

        doc.font('Helvetica').fontSize(9);
        rows.forEach(r => {
            if (doc.y > 740) { doc.addPage(); }
            const y = doc.y;
            doc.text(String(r.id), cols.id, y);
            doc.text(r.name_model, cols.model, y, { width: 100, ellipsis: true });
            doc.text(r.license_plate, cols.plate, y);
            doc.text(String(r.odometer), cols.km, y);
            doc.text(parseFloat(r.total_maint).toFixed(2), cols.maint, y);
            doc.text(parseFloat(r.total_fuel).toFixed(2), cols.fuel, y);
            doc.moveDown(0.5);
        });

        doc.end();

    } catch (error) {
        console.error('[downloadFinancialPDF]', error.message);
        if (!res.headersSent) res.status(500).json({ error: error.message });
    }
};