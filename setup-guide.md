# Local Environment Setup Guide

To get ThreadTrack running locally, follow these steps:

## 1. Prerequisites
- **Node.js**: Install v18 or later from [nodejs.org](https://nodejs.org/).
- **Python**: Install 3.10+ from [python.org](https://python.org/).
- **SQL Server**: Install SQL Server Express (Free Edition) and SQL Server Management Studio (SSMS).
- **Expo Go**: Install on your physical Android/iOS phone.

## 2. Database Setup
1. Open SQL Server Management Studio (SSMS).
2. Connect to your local server (usually `localhost` or `.\SQLEXPRESS`).
3. Open `database/schema.sql` from the project folder.
4. Execute the script (F5) to create the `ThreadTrack` database and tables.

## 3. Backend (Node.js) Setup
1. Navigate to `/backend-node`.
2. Run `npm init -y`.
3. Install dependencies: `npm install express mssql jsonwebtoken dotenv cors`.
4. Create a `.env` file for database credentials.

## 4. Backend (Python) Setup
1. Navigate to `/backend-python`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it: `venv\Scripts\activate`.
4. Install dependencies: `pip install fastapi uvicorn pymssql pydantic pandas`.

## 5. Mobile (React Native) Setup
1. Navigate to `/mobile`.
2. Run `npx create-expo-app@latest .`.
3. Install navigation: `npm install @react-navigation/native @react-navigation/stack expo-location`.
