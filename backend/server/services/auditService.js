import pool from '../config/db.js';

async function _insert(db, { entityType, entityId, action, performedBy, metadata }) {
    await db.query(
        `INSERT INTO audit_logs (entity_type, entity_id, action, performed_by, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
            entityType,
            entityId,
            action,
            performedBy ?? null,
            metadata ? JSON.stringify(metadata) : null,
        ]
    );
}

export const AuditService = {

    async writeInTx(client, entry) {
        try {
            await _insert(client, entry);
        } catch (e) {
            console.error('[AuditService.writeInTx] failed:', e.message, entry);
        }
    },

    async writeSafe(entry) {
        const client = await pool.connect();
        try {
            await _insert(client, entry);
        } catch (e) {
            console.error('[AuditService.writeSafe] failed:', e.message, entry);
        } finally {
            client.release();
        }
    },

    async getTrail(entityType, entityId, limit = 50) {
        const { rows } = await pool.query(
            `SELECT
                al.id,
                al.action,
                al.metadata,
                al.created_at,
                fu.email AS performed_by_email
             FROM audit_logs al
             LEFT JOIN fleet_users fu ON fu.id = al.performed_by
             WHERE al.entity_type = $1 AND al.entity_id = $2
             ORDER BY al.created_at DESC
             LIMIT $3`,
            [entityType, entityId, limit]
        );
        return rows;
    },

    async getRecentEvents(limit = 100, entityType = null) {
        const { rows } = await pool.query(
            `SELECT
                al.id,
                al.entity_type,
                al.entity_id,
                al.action,
                al.metadata,
                al.created_at,
                fu.email AS performed_by_email
             FROM audit_logs al
             LEFT JOIN fleet_users fu ON fu.id = al.performed_by
             WHERE ($1::TEXT IS NULL OR al.entity_type = $1)
             ORDER BY al.created_at DESC
             LIMIT $2`,
            [entityType, limit]
        );
        return rows;
    },
};
