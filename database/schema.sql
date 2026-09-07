-- ============================================================
-- ThreadTrack - PostgreSQL (Neon) Schema
-- Replaces the old MSSQL schema. Idempotent: safe to re-run.
-- Naming matches the live Neon database (all-lowercase columns).
-- ============================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    userid        SERIAL PRIMARY KEY,
    username      VARCHAR NOT NULL UNIQUE,
    passwordhash  VARCHAR NOT NULL,
    role          VARCHAR NOT NULL CHECK (role IN ('Admin', 'Worker', 'Buyer', 'Pending', 'Super Admin')),
    createdat     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    pushtoken     VARCHAR,
    status        VARCHAR DEFAULT 'Approved',
    roleid        INTEGER,
    requestedrole VARCHAR
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    role_id    SERIAL PRIMARY KEY,
    role_name  VARCHAR,
    cre_usr_dt TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ispublic   BOOLEAN DEFAULT true
);

-- Material Types Table
CREATE TABLE IF NOT EXISTS materialtypes (
    id           SERIAL PRIMARY KEY,
    typename     VARCHAR,
    cre_usr_id   VARCHAR,
    cre_usr_dt   TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_usr_id  VARCHAR,
    last_usr_dt  TIMESTAMP WITHOUT TIME ZONE,
    last_usr_ver VARCHAR
);

-- Raw Materials Table
CREATE TABLE IF NOT EXISTS rawmaterials (
    materialid      SERIAL PRIMARY KEY,
    name            VARCHAR NOT NULL,
    currentstock    DOUBLE PRECISION NOT NULL DEFAULT 0,
    unit            VARCHAR NOT NULL, -- e.g., 'meters', 'kg', 'units'
    minimumrequired DOUBLE PRECISION NOT NULL DEFAULT 0,
    lastupdated     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    typeid          INTEGER
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    productid               SERIAL PRIMARY KEY,
    productname             VARCHAR NOT NULL,
    description             TEXT,
    basematerialid          INTEGER REFERENCES rawmaterials(materialid),
    materialquantityperunit DOUBLE PRECISION NOT NULL,
    price                   NUMERIC(10, 2),
    imageurl                TEXT,
    isactive                BOOLEAN DEFAULT true
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    orderid         SERIAL PRIMARY KEY,
    buyerid         INTEGER REFERENCES users(userid),
    productid       INTEGER REFERENCES products(productid),
    quantity        INTEGER NOT NULL,
    status          VARCHAR DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Manufacturing', 'In Progress', 'Completed', 'Cancelled', 'Inquiry')),
    orderdate       TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completiondate  TIMESTAMP WITHOUT TIME ZONE,
    completionnotes TEXT,
    notes           TEXT,
    shippingaddress TEXT
);

-- Production Logs Table (tracks production against specific orders)
CREATE TABLE IF NOT EXISTS productionlogs (
    logid            SERIAL PRIMARY KEY,
    workerid         INTEGER REFERENCES users(userid),
    productid        INTEGER REFERENCES products(productid),
    orderid          INTEGER REFERENCES orders(orderid),
    quantityproduced INTEGER NOT NULL,
    logdate          TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ProductMaterials Table (multiple materials per product)
CREATE TABLE IF NOT EXISTS productmaterials (
    productmaterialid SERIAL PRIMARY KEY,
    productid         INTEGER REFERENCES products(productid) ON DELETE CASCADE,
    materialid        INTEGER REFERENCES rawmaterials(materialid) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notificationid SERIAL PRIMARY KEY,
    userid         INTEGER REFERENCES users(userid) ON DELETE CASCADE,
    title          VARCHAR,
    message        TEXT,
    isread         BOOLEAN DEFAULT false,
    createdat      TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table (system-wide operations)
CREATE TABLE IF NOT EXISTS auditlogs (
    logid      SERIAL PRIMARY KEY,
    userid     INTEGER,
    action     VARCHAR NOT NULL, -- e.g., 'USER_LOGIN', 'CREATE_ORDER'
    entityname VARCHAR,          -- e.g., 'Orders', 'Users'
    entityid   INTEGER,          -- ID of the affected record
    details    TEXT,             -- JSON or descriptive summary of the action
    ipaddress  VARCHAR,
    createdat  TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data (passwords are 'admin123', 'worker123', 'buyer123')
-- Run `node seed.js` instead if you prefer hashed seed users.
