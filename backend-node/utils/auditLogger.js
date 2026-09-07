const { query } = require('../config/db');

/**
 * Log an action to the AuditLogs table
 * @param {Object} params
 * @param {number} params.userId - The ID of the user performing the action
 * @param {string} params.action - The type of action (e.g., 'LOGIN', 'CREATE_ORDER')
 * @param {string} [params.entityName] - The table/item affected
 * @param {number} [params.entityId] - The ID of the record affected
 * @param {Object|string} [params.details] - Additional info (will be stringified if object)
 * @param {string} [params.ipAddress] - IP address of the user
 */
async function logAction({ userId, action, entityName, entityId, details, ipAddress }) {
    try {
        const detailsString = typeof details === 'object' ? JSON.stringify(details) : details;

        await query(
            `
                INSERT INTO auditlogs (userid, action, entityname, entityid, details, ipaddress, createdat)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `,
            [
                userId ?? null,
                action,
                entityName ?? null,
                entityId ?? null,
                detailsString ?? null,
                ipAddress ?? null
            ]
        );
    } catch (err) {
        // We don't want to fail the main transaction if logging fails, but we should record the error
        console.error('Audit Log Error:', err);
    }
}

module.exports = { logAction };
