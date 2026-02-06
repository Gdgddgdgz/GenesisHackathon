const express = require('express');
const router = express.Router();
const db = require('../db');
const redis = require('../redis/client');
const AuditLog = require('../mongo/models/AuditLog');
const { generateRestockMessage } = require('../utils/gemini');
const eventEmitter = require('../utils/events');

// Reusable Stock Update Logic
async function processStockUpdate(product_id, type, quantity, reason) {
    await db.query('BEGIN');
    try {
        // 1. Record Transaction
        await db.query(
            'INSERT INTO inventory_transactions (product_id, type, quantity, reason) VALUES ($1, $2, $3, $4)',
            [product_id, type, quantity, reason]
        );

        // 2. Update Stock
        const updateQuery = type === 'IN'
            ? 'UPDATE products SET current_stock = current_stock + $1 WHERE id = $2 RETURNING current_stock, name, unit_price'
            : 'UPDATE products SET current_stock = current_stock - $1 WHERE id = $2 RETURNING current_stock, name, unit_price';

        const productResult = await db.query(updateQuery, [quantity, product_id]);
        const newData = productResult.rows[0];

        // 3. Check Thresholds & Alert
        const thresholdResult = await db.query('SELECT min_level, max_level FROM thresholds WHERE product_id = $1', [product_id]);
        const threshold = thresholdResult.rows[0] || { min_level: 10, max_level: 100 };
        const { min_level, max_level } = threshold;

        if (newData.current_stock < min_level) {
            const alertMsg = `LOW STOCK ALERT: ${newData.name} is below ${min_level} units!`;
            await redis.publish('inventory_alerts', alertMsg);

            const requiredQty = max_level - newData.current_stock;
            const aiMessage = await generateRestockMessage(newData.name, newData.current_stock, min_level, newData.unit_price, requiredQty);
            console.log(`[AI SERVICE] Generated Restock Message for ${newData.name}:`, aiMessage);
        }

        // 4. Audit Log
        AuditLog.create({
            action: type === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
            entity: 'Product',
            entityId: product_id.toString(),
            details: { quantity, reason, new_stock: newData.current_stock }
        }).catch(err => console.error('Audit Log Error:', err));

        await db.query('COMMIT');
        return newData.current_stock;
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(`[InventoryService] Error updating stock for product ${product_id}:`, err.message);
        throw err;
    }
}

// Event Listener for Billing
eventEmitter.on('BILL_CREATED', async (data) => {
    const { billId, items } = data;
    console.log(`[InventoryListener] Processing Bill ${billId}...`);

    for (const item of items) {
        try {
            await processStockUpdate(item.product_id, 'OUT', item.quantity, `Invoice: ${billId}`);
            console.log(`[InventoryListener] Deducted ${item.quantity} for Product ${item.product_id}`);
        } catch (err) {
            console.error(`[InventoryListener] FAILED to deduct stock for Bill ${billId}, Product ${item.product_id}:`, err.message);
            // In a real app, this would trigger a compensation event or notify the billing service to rollback/void the bill
        }
    }
});

// POST Trigger AI Seasonality Adjustment
router.post('/adjust-thresholds', async (req, res) => {
    const { season } = req.body; // e.g., "Diwali"

    // Simulate AI Logic: Increase thresholds for specific categories
    const highDemandCategories = ['Sweets', 'Snacks', 'Grocery'];
    let updatedCount = 0;

    try {
        const products = await db.query('SELECT * FROM products');

        for (const p of products.rows) {
            if (highDemandCategories.includes(p.category)) {
                // Determine new limit (e.g., 50 -> 100)
                const newMin = season === 'Diwali' ? 100 : 50;

                // Update Mock DB
                await db.query('UPDATE thresholds SET min_level = $1 WHERE product_id = $2', [newMin, p.id]);
                updatedCount++;

                // Audit Log
                await AuditLog.create({
                    action: 'AI_THRESHOLD_UPDATE',
                    entity: 'Product',
                    entityId: p.id.toString(),
                    details: { reason: `Season: ${season}`, new_min: newMin, old_min: 50 },
                    level: 'WARNING'
                });
            }
        }
        res.json({ success: true, message: `Updated thresholds for ${updatedCount} products for ${season}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all products
router.get('/products', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE user_id = $1 ORDER BY id ASC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Audit Logs
router.get('/audit', async (req, res) => {
    try {
        // Mock find().sort() behavior
        const logs = (await AuditLog.find()).sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create product
router.post('/products', async (req, res) => {
    console.log("[API] Received Add Product Request:", req.body); // DEBUG
    const { name, sku, category, unit_price, current_stock } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO products (name, sku, category, unit_price, current_stock, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, sku, category, unit_price, current_stock || 0, req.user.id]
        );
        console.log("[API] Product Added:", result.rows[0]); // DEBUG
        // Initialize default thresholds
        await db.query('INSERT INTO thresholds (product_id) VALUES ($1)', [result.rows[0].id]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Stock Transaction (IN/OUT)
router.post('/transaction', async (req, res) => {
    const { product_id, type, quantity, reason } = req.body;

    if (!['IN', 'OUT'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    try {
        const newStock = await processStockUpdate(product_id, type, quantity, reason);
        res.json({ success: true, new_stock: newStock });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE product
router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM products WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
