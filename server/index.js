const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Database connections will be imported here

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

const inventoryRoutes = require('./routes/inventory');
const vendorRoutes = require('./routes/vendors');
const billingRoutes = require('./routes/billing');

app.use('/api/inventory', inventoryRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/billing', billingRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
