# Local Environment Setup Guide

To get ThreadTrack running locally, follow these steps:

## 1. Prerequisites
- **Node.js**: Install v18 or later from [nodejs.org](https://nodejs.org/).
- **Python**: Install 3.10+ from [python.org](https://python.org/).
- **Neon PostgreSQL**: Create a free database at [neon.tech](https://neon.tech) and copy the connection string.
- **Expo Go**: Install on your physical Android/iOS phone.

## 2. Database Setup
The backend runs on **PostgreSQL (Neon)** — no local database install is required.

1. Create a database on Neon (or use any PostgreSQL instance).
2. Create `backend-node/.env` and set:
   ```
   NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
   JWT_SECRET=<your-secret>
   ```
3. Create the tables and seed roles by running the idempotent migration:
   ```
   cd backend-node
   npm run migrations   # or: node runMigrations.js
   ```
   (`database/schema.sql` is the PostgreSQL schema; it is safe to re-run.)
4. Optionally seed the default users: `node seed.js`.

## 3. Backend (Node.js) Setup
1. Navigate to `/backend-node`.
2. Install dependencies: `npm install` (uses `pg` for PostgreSQL).
3. Make sure `NEON_DATABASE_URL` and `JWT_SECRET` are set in `.env`.
4. Start the server: `npm run dev`.

## 4. Backend (Python) Setup
1. Navigate to `/backend-python`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it: `venv\Scripts\activate`.
4. Install dependencies: `pip install fastapi uvicorn psycopg2-binary pydantic pydantic-settings pandas`.
5. Create `backend-python/.env` with the same database URL:
   ```
   NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
   ```
6. Start the service: `python main.py`.

## 5. Mobile (React Native) Setup
1. Navigate to `/mobile`.
2. Run `npm install`.
3. Start the app: `npx expo start` (or press `w` for web).
