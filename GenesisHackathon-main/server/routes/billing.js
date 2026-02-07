const express = require('express');
const router = express.Router();
const eventEmitter = require('../utils/events');

// POST Generate Mock Bill / Invoice
router.post('/create', async (req, res) => {
    const { items, customer_name, anchorLat, anchorLng } = req.body;
    // items: [{ product_id: 1, quantity: 2 }, ...]

    if (!items || !items.length) {
        return res.status(400).json({ error: 'No items provided' });
    }

    try {
        const billId = `MOCK-INV-${Date.now()}`;

        // Emit BILL_CREATED event
        // We pass the items, billId, and coordinates to the inventory listener
        eventEmitter.emit('BILL_CREATED', {
            billId,
            items,
            customer_name,
            anchorLat,
            anchorLng
        });

        res.status(201).json({
            success: true,
            billId,
            message: 'Mock bill created and stock deduction triggered'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
