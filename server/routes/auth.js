const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

// MOCK USER DB ACCESS
const findUserByEmail = async (email) => {
    // In our mock DB, we can just access mockData if we export it or use a query
    // Let's add a SELECT * FROM USERS to our mock db query logic or just simulate here
    const result = await db.query('SELECT * FROM USERS');
    return result.rows.find(u => u.email === email);
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password, location, geo } = req.body;

    try {
        const userExists = await findUserByEmail(email);
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);
        const geoJson = geo != null ? JSON.stringify(geo) : null;

        // Mocking the insert (location and geo stored in DB)
        const result = await db.query('INSERT INTO USERS (name, email, password, location, geo) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, email, hashedPassword, location || null, geoJson]);
        const newUser = result.rows[0];

        // SEED DEMO DATA FOR NEW USER (Mock Only)
        try {
            // Product 1: High Demand
            const p1 = await db.query('INSERT INTO products (name, sku, category, unit_price, current_stock, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                ['Premium Cotton Shirt', `SKU-${newUser.id}-1`, 'apparel', 1200, 45, newUser.id]);
            await db.query('INSERT INTO thresholds (product_id, min_level, max_level) VALUES ($1, $2, $3)', [p1.rows[0].id, 50, 200]);

            // Product 2: Moving Stock
            const p2 = await db.query('INSERT INTO products (name, sku, category, unit_price, current_stock, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                ['Sports Running Shoes', `SKU-${newUser.id}-2`, 'footwear', 2500, 30, newUser.id]);
            await db.query('INSERT INTO thresholds (product_id, min_level, max_level) VALUES ($1, $2, $3)', [p2.rows[0].id, 40, 150]);

            // Product 3: Low Stock Critical
            const p3 = await db.query('INSERT INTO products (name, sku, category, unit_price, current_stock, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                ['A4 Notebook', `SKU-${newUser.id}-3`, 'stationery', 250, 15, newUser.id]);
            await db.query('INSERT INTO thresholds (product_id, min_level, max_level) VALUES ($1, $2, $3)', [p3.rows[0].id, 100, 500]);

        } catch (seedErr) {
            console.error('Failed to seed demo data:', seedErr);
        }

        res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            token: generateToken(newUser.id)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);

        // In our mock DB, we have hardcoded passwords that aren't actually hashed correctly 
        // for bcrypt comparison if we didn't update them.
        // For the mock system, we'll allow a fallback for our seed users.
        const isMatch = user && (user.password === password || await comparePassword(password, user.password));

        if (user && isMatch) {
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id)
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
