const { query } = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🌱 Seeding database...');

        const users = [
            { username: 'admin', password: 'admin123', role: 'Admin' },
            { username: 'worker1', password: 'worker123', role: 'Worker' },
            { username: 'buyer1', password: 'buyer123', role: 'Buyer' }
        ];

        for (const user of users) {
            // Check if user exists
            const result = await query('SELECT 1 FROM users WHERE username = $1', [user.username]);

            if (result.rows.length === 0) {
                console.log(`Creating user: ${user.username}...`);
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await query(
                    'INSERT INTO users (username, passwordhash, role) VALUES ($1, $2, $3)',
                    [user.username, hashedPassword, user.role]
                );
            } else {
                console.log(`User ${user.username} already exists.`);
            }
        }

        // Seed default roles if missing
        const roleCount = await query('SELECT COUNT(*) AS count FROM roles');
        if (roleCount.rows[0].count === 0) {
            console.log('Seeding default roles...');
            await query(
                `INSERT INTO roles (role_name, ispublic)
                 VALUES ('Super Admin', false), ('Admin', true), ('Worker', true), ('Buyer', true)`
            );
        }

        console.log('✅ Seeding completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
