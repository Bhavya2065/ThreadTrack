const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*', // Allow specific origins or all for development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request Logging
app.use((req, res, next) => {

    next();
});

// Routes
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const productionRoutes = require('./routes/production');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('ThreadTrack API is running...');
});

// Process Error Handlers (Prevents silent exits)
process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n================================`);
    console.log(`🚀 ThreadTrack Backend Active`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📅 Started: ${new Date().toLocaleString()}`);
    console.log(`================================\n`);
});

// Keep-alive to prevent the event loop from becoming empty - removed (Express app.listen handles this)
