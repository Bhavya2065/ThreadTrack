const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');
const { logAction } = require('../utils/auditLogger');

// Fetch Public Roles for Signup
router.get('/roles', async (req, res) => {
    try {
        const pool = await poolPromise;
        const isNeon = !!process.env.NEON_DATABASE_URL;
        const queryStr = isNeon
            ? "SELECT RoleName, rolename FROM Roles WHERE IsPublic = true"
            : "SELECT RoleName FROM Roles WHERE IsPublic = 1";
        const result = await pool.request().query(queryStr);
        res.json(result.recordset.map(r => r.RoleName || r.rolename || r.Role_name));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register User
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Username validation
        const hasLetter = /[a-zA-Z]/.test(username);
        const hasDigit = /[0-9]/.test(username);
        const hasSpace = /\s/.test(username);

        if (!username || username.length < 6 || hasSpace || !hasLetter || !hasDigit) {
            return res.status(400).json({
                error: 'Username must be at least 6 characters, contain both letters and digits, and have no spaces.',
                type: 'validation_error'
            });
        }

        const pool = await poolPromise;

        // Check if user already exists
        const existingUser = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT 1 FROM Users WHERE Username = @username');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Security check: Never allow Super Admin to be requested via public API
        if (role && (role.toLowerCase() === 'super admin' || role.toLowerCase() === 'admin')) {
            return res.status(400).json({
                error: 'Restricted role request. Please contact the system owner for specialized access.',
                type: 'restricted_role'
            });
        }

        // Enforce Pending status and save requested role
        const initialStatus = 'Pending';
        const requestedRole = role || 'Buyer';

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('status', sql.NVarChar, initialStatus)
            .input('requestedRole', sql.NVarChar, requestedRole)
            .query('INSERT INTO Users (Username, PasswordHash, Role, Status, RequestedRole, RoleID) OUTPUT INSERTED.UserID VALUES (@username, @password, NULL, @status, @requestedRole, NULL)');

        const newUserId = result.recordset[0].UserID;

        // Log registration
        await logAction({
            userId: newUserId,
            action: 'USER_REGISTER',
            entityName: 'Users',
            entityId: newUserId,
            details: {
                username,
                role: requestedRole,
                timestamp: new Date().toISOString(),
                userAgent: req.headers['user-agent']
            },
            ipAddress: req.ip
        });

        res.status(201).json({ message: 'User registered successfully', role: requestedRole });
    } catch (err) {
        console.error('[Auth] Registration Error:', err);

        // Proper Error Handling as per user rules (specific error types)
        if (err.code === 'ETIMEOUT') {
            return res.status(408).json({
                error: 'Database timeout occurred. Please try again later.',
                type: 'timeout'
            });
        }

        if (err.message && err.message.includes('unique constraint')) {
            return res.status(400).json({
                error: 'Username already exists.',
                type: 'duplicate'
            });
        }

        res.status(500).json({
            error: 'An internal server error occurred during registration.',
            details: err.message,
            type: 'server_error'
        });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[Auth] Login attempt for user: ${username}`);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE Username = @username');

        const user = result.recordset[0];
        if (!user) {
            // Log failed login (user not found)
            await logAction({
                action: 'FAILED_LOGIN_ATTEMPT',
                details: {
                    attemptedUsername: username,
                    reason: 'User not found',
                    userAgent: req.headers['user-agent']
                },
                ipAddress: req.ip
            });
            return res.status(404).json({ message: 'User not found. Please check your username.' });
        }

        // Check verification status
        if (user.Status === 'Pending') {
            return res.status(403).json({
                message: 'Your account is pending approval. Please wait for a Super Admin to verify your request.',
                type: 'pending_approval'
            });
        }

        if (user.Status === 'Rejected') {
            return res.status(403).json({
                message: 'Your registration request has been rejected. Please contact support for more information.',
                type: 'rejected'
            });
        }

        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            // Log failed login (wrong password)
            await logAction({
                userId: user.UserID,
                action: 'FAILED_LOGIN_ATTEMPT',
                details: {
                    username: user.Username,
                    reason: 'Incorrect password',
                    userAgent: req.headers['user-agent']
                },
                ipAddress: req.ip
            });
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }

        const token = jwt.sign(
            { id: user.UserID, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Log login
        await logAction({
            userId: user.UserID,
            action: 'USER_LOGIN',
            entityName: 'Users',
            entityId: user.UserID,
            details: {
                username: user.Username,
                role: user.Role,
                loginTime: new Date().toISOString(),
                userAgent: req.headers['user-agent']
            },
            ipAddress: req.ip
        });

        res.json({ token, role: user.Role, username: user.Username, id: user.UserID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
