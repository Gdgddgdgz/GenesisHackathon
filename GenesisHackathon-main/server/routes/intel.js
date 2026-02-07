const express = require('express');
const router = express.Router();
const { getZonesWithinRadius, calculateDistance } = require('../db/zones');
const { generateLocationInsight, generateSpecificLocationInsight } = require('../utils/gemini');
const { resolveMicroLocation } = require('../utils/geocoder');

// POST /intel/analyze
// Analyzes zones within radius of anchor point and generates Gemini insights
router.post('/analyze', async (req, res) => {
    try {
        const { lat, lng, radius = 15 } = req.body;

        // Validation
        if (!lat || !lng) {
            return res.status(400).json({
                error: 'Missing required parameters: lat, lng'
            });
        }

        // Validate India coordinates (approximate bounds)
        // India: Latitude 8°N to 35°N, Longitude 68°E to 97°E
        if (lat < 8 || lat > 35 || lng < 68 || lng > 97) {
            return res.status(400).json({
                error: 'Coordinates outside India boundaries',
                message: 'Please select a location within India (Lat: 8-35°N, Lng: 68-97°E)'
            });
        }

        // Enforce radius bounds (10-15 km)
        const enforcedRadius = Math.min(Math.max(radius, 10), 15);

        console.log(`[Location Intel] Analyzing anchor: ${lat.toFixed(4)}, ${lng.toFixed(4)} with ${enforcedRadius}km radius`);

        // Get zones within radius (now uses dynamic generation)
        const zonesInRadius = await getZonesWithinRadius(lat, lng, enforcedRadius);

        if (zonesInRadius.length === 0) {
            return res.json({
                anchor: { lat, lng },
                radius: enforcedRadius,
                zones: [],
                metadata: {
                    analysis_type: 'dynamic_generation',
                    coverage_quality: 'low',
                    message: 'No zones found within radius. Try a different location in India.'
                }
            });
        }

        console.log(`[Location Intel] Found ${zonesInRadius.length} zones. Fetching inventory context...`);

        // Fetch Inventory Context (Low stock items)
        const db = require('../db');
        const inventoryResult = await db.query('SELECT p.*, t.min_level FROM products p LEFT JOIN thresholds t ON p.id = t.product_id');
        const lowStockItems = inventoryResult.rows
            .filter(p => p.current_stock < (p.min_level || 50))
            .map(p => ({ name: p.name, stock: p.current_stock, min: p.min_level || 50 }));

        const inventoryContext = {
            lowStock: lowStockItems.slice(0, 5),
            totalProducts: inventoryResult.rows.length
        };

        // Generate Gemini insights for each zone with inventory context
        const zonesWithInsights = await Promise.all(
            zonesInRadius.map(async (zone) => {
                const insight = await generateLocationInsight(zone, inventoryContext);
                return {
                    ...zone,
                    insight
                };
            })
        );

        console.log(`[Location Intel] Successfully generated insights for ${zonesWithInsights.length} zones`);

        res.json({
            anchor: { lat, lng },
            radius: enforcedRadius,
            zones: zonesWithInsights,
            count: zonesWithInsights.length,
            metadata: {
                analysis_type: zonesWithInsights[0]?.id?.startsWith('generated_') ? 'dynamic_generation' : 'pre_seeded',
                coverage_quality: zonesWithInsights.length >= 10 ? 'high' : zonesWithInsights.length >= 5 ? 'medium' : 'low',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Intel analysis error:', error);
        res.status(500).json({
            error: 'Failed to generate location intelligence',
            details: error.message
        });
    }
});

// POST /intel/detailed-insight
// Resolves specific micro-location and generates targeted insight

router.post('/detailed-insight', async (req, res) => {
    try {
        const { lat, lng, anchorLat, anchorLng, radius = 15, zoneType, zoneContext, distance } = req.body;

        if (!lat || !lng || !anchorLat || !anchorLng) {
            return res.status(400).json({ error: 'Missing coordinates' });
        }

        // 1. Security Check: Enforce Radius (Server-side validation)
        // We calculate precise distance server-side to prevent tampering
        const calculatedDistance = calculateDistance(anchorLat, anchorLng, lat, lng);

        if (calculatedDistance > (radius + 0.5)) { // 0.5km buffer for edge cases
            return res.status(403).json({
                error: 'Out of bounds',
                message: 'This zone is outside the authorized analysis radius.'
            });
        }

        // 2. Resolve Micro-Location Name
        console.log(`[Intel] Resolving micro-location for ${lat}, ${lng}...`);
        let locationName = await resolveMicroLocation(lat, lng);

        if (!locationName) {
            // Fallback generation if geocoding fails
            locationName = `${zoneType} Zone (Sector ${Math.floor(Math.random() * 20) + 1})`;
        }

        // Fetch Inventory Context for specific insight
        const db = require('../db');
        const inventoryResult = await db.query('SELECT p.*, t.min_level FROM products p LEFT JOIN thresholds t ON p.id = t.product_id');
        const lowStockItems = inventoryResult.rows
            .filter(p => p.current_stock < (p.min_level || 50))
            .map(p => ({ name: p.name, stock: p.current_stock, min: p.min_level || 50 }));

        const inventoryContext = {
            lowStock: lowStockItems.slice(0, 5),
            totalProducts: inventoryResult.rows.length
        };

        // 3. Generate Specific Insight
        console.log(`[Intel] Generating insight for "${locationName}" with inventory context...`);
        const insight = await generateSpecificLocationInsight(locationName, {
            type: zoneType,
            distance: calculatedDistance,
            community_context: zoneContext
        }, inventoryContext);

        res.json({
            locationName,
            insight,
            distance: calculatedDistance,
            verified: true
        });

    } catch (error) {
        console.error('Detailed insight error:', error);
        res.status(500).json({ error: 'Failed to generate detailed insight' });
    }
});

module.exports = router;
