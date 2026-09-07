const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { logAction } = require('../utils/auditLogger');

// Get all pending users (Admin/Super Admin only)
router.get('/pending', auth(['Admin', 'Super Admin']), async (req, res) => {
    try {
        const result = await query(
            `SELECT userid AS "UserID", username AS "Username", requestedrole AS "RequestedRole", createdat AS "CreatedAt"
             FROM users
             WHERE status = 'Pending'
             ORDER BY createdat DESC`
        );
        res.json(result.rows);
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

        // Fetch requested role first if approving
        let roleToSet = null;
        let roleIdToSet = null;
        let statusToSet = 'Rejected';

        if (action === 'Approve') {
            const userRes = await query(
                'SELECT requestedrole AS "RequestedRole" FROM users WHERE userid = $1',
                [id]
            );

            if (userRes.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            roleToSet = userRes.rows[0].RequestedRole || 'Buyer';
            statusToSet = 'Approved';

            // Fetch the corresponding RoleID from Roles table
            const roleInfoRes = await query(
                'SELECT role_id AS "RoleID" FROM roles WHERE role_name = $1',
                [roleToSet]
            );

            if (roleInfoRes.rows.length > 0) {
                roleIdToSet = roleInfoRes.rows[0].RoleID;
            }
        }

        const result = await query(
            'UPDATE users SET status = $1, role = $2, roleid = $3 WHERE userid = $4',
            [statusToSet, roleToSet, roleIdToSet, id]
        );

        if (result.rowCount === 0) {
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
