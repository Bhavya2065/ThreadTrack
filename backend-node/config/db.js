const requireDotenv = require('dotenv');
requireDotenv.config();

const neonUrl = process.env.NEON_DATABASE_URL;

let poolPromise;
let sql = {
    NVarChar: 'NVarChar',
    Int: 'Int',
    Float: 'Float',
    Decimal: 'Decimal',
    DateTime: 'DateTime',
    Bit: 'Bit',
    Text: 'Text'
};

if (neonUrl) {
    console.log("⚡ Using Neon PostgreSQL Cloud Database Adapter...");
    const { Pool } = require('pg');
    const pgPool = new Pool({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });

    class PgRequestWrapper {
        constructor() {
            this.inputs = [];
        }

        input(name, type, value) {
            this.inputs.push({ name, value });
            return this;
        }

        async query(queryText) {
            let sqlStr = queryText;
            const values = [];

            // Convert MSSQL OUTPUT INSERTED.ColName to RETURNING ColName
            sqlStr = sqlStr.replace(/OUTPUT\s+INSERTED\.(\w+)/gi, 'RETURNING "$1"');

            // Convert MSSQL (SELECT ... FOR JSON PATH) to PostgreSQL json_agg subquery
            sqlStr = sqlStr.replace(/\(\s*SELECT\s+MaterialID\s+FROM\s+ProductMaterials\s+(\w+)\s+WHERE\s+([^)]+)\s+FOR\s+JSON\s+PATH\s*\)/gi,
                '(SELECT json_agg(json_build_object(\'MaterialID\', $1.materialid)) FROM productmaterials $1 WHERE $2)'
            );

            // Replace @paramName with $1, $2, etc.
            this.inputs.forEach((inp) => {
                const regex = new RegExp(`@${inp.name}\\b`, 'gi');
                if (regex.test(sqlStr)) {
                    values.push(inp.value);
                    sqlStr = sqlStr.replace(regex, `$${values.length}`);
                }
            });

            // Convert MSSQL SELECT TOP N to LIMIT N
            if (/SELECT\s+TOP\s+(\d+)/i.test(sqlStr)) {
                const topMatch = sqlStr.match(/SELECT\s+TOP\s+(\d+)/i);
                if (topMatch) {
                    const topNum = topMatch[1];
                    sqlStr = sqlStr.replace(/SELECT\s+TOP\s+\d+/gi, 'SELECT');
                    sqlStr += ` LIMIT ${topNum}`;
                }
            }

            // Convert DATEADD(day, N, expr) to PostgreSQL (expr +/- INTERVAL 'N days')
            sqlStr = sqlStr.replace(/DATEADD\s*\(\s*day\s*,\s*(-?\d+)\s*,\s*(GETDATE\(\)|GETUTCDATE\(\))\s*\)/gi, (match, p1) => {
                const n = parseInt(p1);
                return n >= 0 ? `(CURRENT_TIMESTAMP + INTERVAL '${n} days')` : `(CURRENT_TIMESTAMP - INTERVAL '${Math.abs(n)} days')`;
            });
            sqlStr = sqlStr.replace(/DATEADD\s*\(\s*day\s*,\s*(-?\d+)\s*,\s*([a-zA-Z0-9_.]+)\s*\)/gi, (match, p1, p2) => {
                const n = parseInt(p1);
                return n >= 0 ? `(${p2} + INTERVAL '${n} days')` : `(${p2} - INTERVAL '${Math.abs(n)} days')`;
            });

            // Convert MSSQL BIT comparisons (= 1 / = 0) to Postgres BOOLEAN (= true / = false)
            sqlStr = sqlStr.replace(/\bIsPublic\s*=\s*1\b/gi, 'IsPublic = true');
            sqlStr = sqlStr.replace(/\bIsPublic\s*=\s*0\b/gi, 'IsPublic = false');
            sqlStr = sqlStr.replace(/\bIsActive\s*=\s*1\b/gi, 'IsActive = true');
            sqlStr = sqlStr.replace(/\bIsActive\s*=\s*0\b/gi, 'IsActive = false');

            // Replace MSSQL functions with Postgres equivalents
            sqlStr = sqlStr.replace(/GETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
            sqlStr = sqlStr.replace(/GETUTCDATE\(\)/gi, 'CURRENT_TIMESTAMP');

            const res = await pgPool.query(sqlStr, values);

            // Normalize column casing in recordset (e.g. userid -> UserID, username -> Username)
            const recordset = (res.rows || []).map(row => {
                const normalized = {};
                for (const key of Object.keys(row)) {
                    const kLower = key.toLowerCase();
                    let targetKey = key;
                    if (kLower === 'userid') targetKey = 'UserID';
                    else if (kLower === 'username') targetKey = 'Username';
                    else if (kLower === 'name') targetKey = 'Name';
                    else if (kLower === 'rolename' || kLower === 'role_name') targetKey = 'RoleName';
                    else if (kLower === 'passwordhash') targetKey = 'PasswordHash';
                    else if (kLower === 'role') targetKey = 'Role';
                    else if (kLower === 'createdat') targetKey = 'CreatedAt';
                    else if (kLower === 'pushtoken') targetKey = 'PushToken';
                    else if (kLower === 'status') targetKey = 'Status';
                    else if (kLower === 'roleid') targetKey = 'RoleID';
                    else if (kLower === 'requestedrole') targetKey = 'RequestedRole';
                    else if (kLower === 'materialid') targetKey = 'MaterialID';
                    else if (kLower === 'productid') targetKey = 'ProductID';
                    else if (kLower === 'orderid') targetKey = 'OrderID';
                    else if (kLower === 'productname') targetKey = 'ProductName';
                    else if (kLower === 'currentstock') targetKey = 'CurrentStock';
                    else if (kLower === 'minimumrequired') targetKey = 'MinimumRequired';
                    else if (kLower === 'unit') targetKey = 'Unit';
                    else if (kLower === 'typename') targetKey = 'TypeName';
                    else if (kLower === 'price') targetKey = 'Price';
                    else if (kLower === 'imageurl') targetKey = 'ImageURL';
                    else if (kLower === 'isactive') targetKey = 'IsActive';
                    else if (kLower === 'quantity') targetKey = 'Quantity';
                    else if (kLower === 'orderdate') targetKey = 'OrderDate';
                    else if (kLower === 'completiondate') targetKey = 'CompletionDate';
                    else if (kLower === 'completionnotes') targetKey = 'CompletionNotes';
                    else if (kLower === 'logid') targetKey = 'LogID';
                    else if (kLower === 'workerid') targetKey = 'WorkerID';
                    else if (kLower === 'quantityproduced') targetKey = 'QuantityProduced';
                    else if (kLower === 'logdate') targetKey = 'LogDate';
                    else if (kLower === 'action') targetKey = 'Action';
                    else if (kLower === 'entityname') targetKey = 'EntityName';
                    else if (kLower === 'entityid') targetKey = 'EntityID';
                    else if (kLower === 'details') targetKey = 'Details';
                    else if (kLower === 'ipaddress') targetKey = 'IPAddress';
                    else if (kLower === 'title') targetKey = 'Title';
                    else if (kLower === 'message') targetKey = 'Message';
                    else if (kLower === 'isread') targetKey = 'IsRead';
                    else if (kLower === 'shippingaddress') targetKey = 'ShippingAddress';
                    else if (kLower === 'notes') targetKey = 'Notes';
                    else if (kLower === 'materialids') {
                        targetKey = 'MaterialIDs';
                        // If materialids is a JSON array string from pg, convert to JSON string matching MSSQL format
                        if (typeof row[key] === 'object' && row[key] !== null) {
                            normalized[targetKey] = JSON.stringify(row[key]);
                            continue;
                        }
                    }

                    normalized[targetKey] = row[key];
                }
                return normalized;
            });

            return {
                recordset,
                rowsAffected: [res.rowCount || 0]
            };
        }
    }

    const pgAdapterPool = {
        request: () => new PgRequestWrapper()
    };

    poolPromise = Promise.resolve(pgAdapterPool);

} else {
    // Local MSSQL Database Fallback
    const mssql = require('mssql');
    sql = mssql;
    const dbConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER || 'localhost',
        database: process.env.DB_DATABASE || 'ThreadTrack',
        options: {
            trustServerCertificate: true
        }
    };

    poolPromise = new mssql.ConnectionPool(dbConfig)
        .connect()
        .then(pool => {
            console.log('✅ Connected to local MSSQL Database');
            return pool;
        })
        .catch(err => {
            console.error('❌ Database Connection Failed: ', err);
            throw err;
        });
}

module.exports = {
    sql,
    poolPromise
};
