const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/outlets — list outlets for the authenticated user
router.get('/', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const result = await db.query('SELECT * FROM OUTLETS WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/outlets — add a new outlet
router.post('/', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { location, geo_display_name, lat, lon } = req.body;
    if (!location || !location.trim()) {
        return res.status(400).json({ error: 'Location is required' });
    }
    try {
        const result = await db.query(
            'INSERT INTO OUTLETS (user_id, location, geo_display_name, lat, lon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, location.trim(), geo_display_name || null, lat ?? null, lon ?? null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/outlets/:id
router.delete('/:id', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid outlet id' });
    try {
        const existing = await db.query('SELECT * FROM OUTLETS WHERE user_id = $1', [userId]);
        const outlet = existing.rows.find(o => o.id === id);
        if (!outlet) return res.status(404).json({ error: 'Outlet not found' });
        await db.query('DELETE FROM OUTLETS WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
