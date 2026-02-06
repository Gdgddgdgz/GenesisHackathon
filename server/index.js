const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Database connections will be imported here

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Global error handler for JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON received:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

// Prevent server crashes from unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Keep server running but log critical error
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

const inventoryRoutes = require('./routes/inventory');
const vendorRoutes = require('./routes/vendors');
const billingRoutes = require('./routes/billing');
const intelRoutes = require('./routes/intel');

app.use('/api/inventory', inventoryRoutes);

app.use('/api/vendors', vendorRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/intel', intelRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Keep alive to prevent immediate exit if event loop drains
    setInterval(() => {
        // Heartbeat
    }, 60000);
});
