const express = require('express');
const router = express.Router();
const db = require('../db');
const AuditLog = require('../mongo/models/AuditLog');

// GET all vendors
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vendors ORDER BY trust_score DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create vendor
router.post('/', async (req, res) => {
    const { name, phone, categories } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO vendors (name, phone, categories) VALUES ($1, $2, $3) RETURNING *',
            [name, phone, categories]
        );

        // Audit Log
        try {
            await AuditLog.create({
                action: 'CREATE_VENDOR',
                entity: 'Vendor',
                entityId: result.rows[0].id.toString(),
                details: { name, phone }
            });
        } catch (auditErr) {
            console.error('Audit Log Failed:', auditErr);
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Auto-Draft Message (Co-Pilot)
router.post('/draft-order', async (req, res) => {
    const { vendor_id, product_name, quantity, last_price } = req.body;

    // Stub: In real system, fetch vendor phone/name from DB
    // const vendor = await db.query('SELECT * FROM vendors WHERE id = $1', [vendor_id]);

    const message = `Namaste, need ${quantity} units of ${product_name}. Last price ₹${last_price}/unit. Can you match and confirm delivery?`;

    res.json({
        vendor_id,
        draft_message: message,
        whatsapp_link: `https://wa.me/?text=${encodeURIComponent(message)}`
    });
});

// POST Smart Price Update (Vendor Co-Pilot)
router.post('/update-price', async (req, res) => {
    const { vendor_id, product_sku, new_price } = req.body;

    // Simulate updating vendor price history or product cost
    // For mock, we just log it and update the main product price as "Last Sourced Price"
    try {
        await db.query('UPDATE products SET unit_price = $1 WHERE sku = $2', [new_price, product_sku]);

        await AuditLog.create({
            action: 'VENDOR_PRICE_UPDATE',
            entity: 'Vendor',
            entityId: vendor_id.toString(),
            details: { sku: product_sku, new_price, source: 'WhatsApp Bot' }
        });

        res.json({ success: true, message: 'Price updated from Vendor Feed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Update Vendor Trust Score (Simulation)
router.post('/:id/trust-adjustment', async (req, res) => {
    const { id } = req.params;
    const { delta, reason } = req.body; // delta: +2, -5, -3 etc.
    try {
        const result = await db.query('UPDATE VENDORS SET TRUST_SCORE = $1 WHERE ID = $2', [delta, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        // Audit Log
        try {
            await AuditLog.create({
                action: 'VENDOR_TRUST_UPDATE',
                entity: 'Vendor',
                entityId: id,
                details: { delta, reason, simulated: true }
            });
        } catch (auditErr) {
            console.error('Audit Log Failed:', auditErr);
        }

        res.json({ success: true, new_score: result.rows[0].trust_score, message: `Trust adjusted: ${reason}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE vendor
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM vendors WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }
        res.json({ success: true, message: 'Vendor deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
