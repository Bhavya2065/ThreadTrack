require('dotenv').config();

const { Pool } = require('pg');

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        'NEON_DATABASE_URL (or DATABASE_URL) is not set. This backend now runs on PostgreSQL (Neon) only.'
    );
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

/**
 * Map lowercase PostgreSQL column names to the PascalCase keys the API responses
 * have always used. The mobile/web clients depend on these names, so every row
 * returned by query()/withTransaction() is normalized through this map.
 * Keys NOT in this map are returned exactly as PostgreSQL provides them
 * (e.g. 'count', 'date', 'total', 'material', 'days_remaining').
 */
const KEY_MAP = {
    userid: 'UserID',
    username: 'Username',
    name: 'Name',
    rolename: 'RoleName',
    role_name: 'RoleName',
    roleid: 'RoleID',
    role_id: 'RoleID',
    passwordhash: 'PasswordHash',
    role: 'Role',
    createdat: 'CreatedAt',
    pushtoken: 'PushToken',
    status: 'Status',
    requestedrole: 'RequestedRole',
    materialid: 'MaterialID',
    productid: 'ProductID',
    orderid: 'OrderID',
    productname: 'ProductName',
    currentstock: 'CurrentStock',
    minimumrequired: 'MinimumRequired',
    unit: 'Unit',
    typename: 'TypeName',
    price: 'Price',
    imageurl: 'ImageURL',
    isactive: 'IsActive',
    isread: 'IsRead',
    ispublic: 'IsPublic',
    quantity: 'Quantity',
    buyerid: 'BuyerID',
    orderdate: 'OrderDate',
    completiondate: 'CompletionDate',
    completionnotes: 'CompletionNotes',
    logid: 'LogID',
    workerid: 'WorkerID',
    quantityproduced: 'QuantityProduced',
    logdate: 'LogDate',
    action: 'Action',
    entityname: 'EntityName',
    entityid: 'EntityID',
    details: 'Details',
    ipaddress: 'IPAddress',
    title: 'Title',
    message: 'Message',
    shippingaddress: 'ShippingAddress',
    notes: 'Notes',
    description: 'Description',
    basematerialid: 'BaseMaterialID',
    materialquantityperunit: 'MaterialQuantityPerUnit',
    lastupdated: 'LastUpdated',
    typeid: 'TypeID',
    id: 'ID',
    productmaterialid: 'ProductMaterialID',
    notificationid: 'NotificationID',
};

function normalizeRow(row) {
    const normalized = {};
    for (const key of Object.keys(row)) {
        const value = row[key];
        const targetKey = KEY_MAP[key.toLowerCase()] || key;

        // PostgreSQL NUMERIC comes back as a string; restore numbers like MSSQL did
        if (targetKey === 'Price' && typeof value === 'string') {
            normalized[targetKey] = parseFloat(value);
            continue;
        }

        normalized[targetKey] = value;
    }
    return normalized;
}

function normalizeRows(rows) {
    return (rows || []).map(normalizeRow);
}

/**
 * Run a query against the pool.
 * Returns { rows, rowCount } with PascalCase-normalized keys.
 */
async function query(text, params = []) {
    const res = await pool.query(text, params);
    return { rows: normalizeRows(res.rows), rowCount: res.rowCount };
}

/**
 * Run fn inside a SQL transaction.
 * fn receives a `tx` object exposing the same .query(text, params) API.
 * Commits on success, rolls back and re-throws on error.
 */
async function withTransaction(fn) {
    const client = await pool.connect();
    const tx = {
        query: async (text, params = []) => {
            const res = await client.query(text, params);
            return { rows: normalizeRows(res.rows), rowCount: res.rowCount };
        },
    };
    try {
        await client.query('BEGIN');
        const result = await fn(tx);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) { /* connection already broken */ }
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { pool, query, withTransaction };
