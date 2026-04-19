const { poolPromise, sql } = require('../config/db');

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
        const pool = await poolPromise;
        const detailsString = typeof details === 'object' ? JSON.stringify(details) : details;

        await pool.request()
            .input('userId', sql.Int, userId || null)
            .input('action', sql.NVarChar, action)
            .input('entityName', sql.NVarChar, entityName || null)
            .input('entityId', sql.Int, entityId || null)
            .input('details', sql.NVarChar, detailsString || null)
            .input('ipAddress', sql.NVarChar, ipAddress || null)
            .query(`
                INSERT INTO AuditLogs (UserID, Action, EntityName, EntityID, Details, IPAddress, CreatedAt)
                VALUES (@userId, @action, @entityName, @entityId, @details, @ipAddress, GETUTCDATE())
            `);
    } catch (err) {
        // We don't want to fail the main transaction if logging fails, but we should record the error
        console.error('Audit Log Error:', err);
    }
}

module.exports = { logAction };
