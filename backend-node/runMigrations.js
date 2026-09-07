const fs = require('fs');
const path = require('path');
const { pool, query } = require('./config/db');

async function runMigrations() {
    try {
        console.log('Running PostgreSQL (Neon) migrations...');

        // 1. Apply the base schema (idempotent CREATE TABLE IF NOT EXISTS statements)
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('Applying base schema (database/schema.sql)...');
        await pool.query(schemaSql);

        // 2. Seed default roles if missing
        const roleCount = await query('SELECT COUNT(*) AS count FROM roles');
        if (roleCount.rows[0].count === 0) {
            console.log('Seeding default roles...');
            await query(
                `INSERT INTO roles (role_name, ispublic)
                 VALUES ('Super Admin', false), ('Admin', true), ('Worker', true), ('Buyer', true)`
            );
        } else {
            console.log('Roles already seeded.');
        }

        // 3. Ensure existing users are approved
        await query("UPDATE users SET status = 'Approved' WHERE status IS NULL");

        console.log('✅ Migrations completed successfully');
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();
