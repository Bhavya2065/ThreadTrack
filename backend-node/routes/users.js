const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { logAction } = require('../utils/auditLogger');

// Get all pending users (Admin/Super Admin only)
router.get('/pending', auth(['Admin', 'Super Admin']), async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT UserID, Username, RequestedRole, CreatedAt FROM Users WHERE Status = 'Pending' ORDER BY CreatedAt DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve/Reject user registration
router.put('/approval/:id', auth(['Admin', 'Super Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'Approve' or 'Reject'

        if (!['Approve', 'Reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be Approve or Reject' });
        }

        const pool = await poolPromise;

        // Fetch requested role first if approving
        let roleToSet = null;
        let roleIdToSet = null;
        let statusToSet = 'Rejected';

        if (action === 'Approve') {
            const userRes = await pool.request()
                .input('id', sql.Int, id)
                .query("SELECT RequestedRole FROM Users WHERE UserID = @id");

            if (userRes.recordset.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            roleToSet = userRes.recordset[0].RequestedRole || 'Buyer';
            statusToSet = 'Approved';

            // Fetch the corresponding RoleID from Roles table
            const roleInfoRes = await pool.request()
                .input('roleName', sql.NVarChar, roleToSet)
                .query("SELECT Role_id FROM Roles WHERE Role_name = @roleName");

            if (roleInfoRes.recordset.length > 0) {
                roleIdToSet = roleInfoRes.recordset[0].Role_id;
            }
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('role', sql.NVarChar, roleToSet)
            .input('roleId', sql.Int, roleIdToSet)
            .input('status', sql.NVarChar, statusToSet)
            .query("UPDATE Users SET Status = @status, Role = @role, RoleID = @roleId WHERE UserID = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'User not found or update failed' });
        }

        // Log approval action
        await logAction({
            userId: req.user.id,
            action: `USER_REGISTRATION_${action.toUpperCase()}`,
            entityName: 'Users',
            entityId: id,
            details: {
                admin: req.user.username,
                targetUserId: id,
                finalRole: roleToSet,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip
        });

        res.json({ message: `User registration ${action === 'Approve' ? 'approved' : 'rejected'} successfully.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
