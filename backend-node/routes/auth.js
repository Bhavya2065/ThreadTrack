const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const pool = await poolPromise;

        // Check if user already exists
        const existingUser = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT 1 FROM Users WHERE Username = @username');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Enforce 'Buyer' role for all public registrations to prevent role escalation
        const userRole = 'Buyer';

        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('role', sql.NVarChar, userRole)
            .query('INSERT INTO Users (Username, PasswordHash, Role) VALUES (@username, @password, @role)');

        res.status(201).json({ message: 'User registered successfully', role: userRole });
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
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.UserID, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, role: user.Role, username: user.Username, id: user.UserID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Push Token
router.post('/update-push-token', async (req, res) => {
    try {
        const { userId, pushToken } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });

        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('pushToken', sql.NVarChar, pushToken)
            .query('UPDATE Users SET PushToken = @pushToken WHERE UserID = @userId');

        res.json({ message: 'Push token updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
