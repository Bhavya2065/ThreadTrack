const { poolPromise, sql } = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        const pool = await poolPromise;
        console.log('🌱 Seeding database...');

        const users = [
            { username: 'admin', password: 'admin123', role: 'Admin' },
            { username: 'worker1', password: 'worker123', role: 'Worker' },
            { username: 'buyer1', password: 'buyer123', role: 'Buyer' }
        ];

        for (const user of users) {
            // Check if user exists
            const result = await pool.request()
                .input('username', sql.NVarChar, user.username)
                .query('SELECT 1 FROM Users WHERE Username = @username');

            if (result.recordset.length === 0) {
                console.log(`Creating user: ${user.username}...`);
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await pool.request()
                    .input('username', sql.NVarChar, user.username)
                    .input('password', sql.NVarChar, hashedPassword)
                    .input('role', sql.NVarChar, user.role)
                    .query('INSERT INTO Users (Username, PasswordHash, Role) VALUES (@username, @password, @role)');
            } else {
                console.log(`User ${user.username} already exists.`);
            }
        }

        console.log('✅ Seeding completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
