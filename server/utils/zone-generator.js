// DYNAMIC ZONE GENERATOR FOR PAN-INDIA COVERAGE
// Generates realistic zones using Mapbox Geocoding API proximity search

const axios = require('axios');
const { findNearestCity } = require('../db/india-cities');
const { suggestZoneNames } = require('./gemini');
const dotenv = require('dotenv');
dotenv.config();

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

// Haversine distance calculation (precise)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Generate community context based on nearest city and region
function generateCommunityContext(nearestCity, areaType) {
    const contexts = [];
    contexts.push(nearestCity.cultural_context);

    if (areaType === 'Commercial') {
        if (nearestCity.economic_activity.includes('technology') || nearestCity.economic_activity.includes('IT')) {
            contexts.push('Young professional & startup culture');
        } else if (nearestCity.economic_activity.includes('trade')) {
            contexts.push('Business community with traditional commerce');
        } else {
            contexts.push('Tourism-driven economy with service sector');
        }
    } else if (areaType === 'Industrial') {
        contexts.push('Working-class industrial labor; blue-collar employment');
    } else if (areaType === 'Residential') {
        contexts.push('Family-oriented residential community');
    } else if (areaType === 'Mixed-Use') {
        contexts.push('Diverse mix of residential and commercial activity');
    } else if (areaType === 'Institutional') {
        contexts.push('Academic, research, or healthcare focused community; high student/patient/professional density');
    }
    return contexts.join('; ');
}

// Generate seasonal signals based on city festivals and economic patterns
function generateSeasonalSignals(nearestCity, areaType) {
    const signals = [];
    const festivals = nearestCity.festivals.slice(0, 2);
    if (festivals.length > 0) signals.push(`${festivals.join(', ')} demand peaks`);

    if (areaType === 'Commercial') {
        signals.push('Year-round commercial activity; Q4 sales peaks');
    } else if (areaType === 'Residential') {
        signals.push('Wedding season (Nov-Feb); festival buying cycles');
    } else if (areaType === 'Industrial') {
        signals.push('Production cycles; quarterly demand patterns');
    } else if (areaType === 'Institutional') {
        signals.push('Academic semesters (July-Dec, Jan-May); health awareness cycles');
    } else {
        signals.push('Mixed seasonal patterns');
    }
    return signals.join('; ');
}

/**
 * Fetch real zones from Mapbox for a specific query type
 */
async function fetchZonesByType(anchorLat, anchorLng, query, areaType, limit = 5) {
    if (!MAPBOX_TOKEN) return [];

    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
        const response = await axios.get(url, {
            params: {
                access_token: MAPBOX_TOKEN,
                proximity: `${anchorLng},${anchorLat}`,
                limit: limit,
                types: 'neighborhood,poi,address' // Exclude locality, district, place to avoid broad area centers (often in water)
            }
        });

        if (!response.data || !response.data.features) return [];

        return response.data.features.map((f, index) => ({
            id: `real_${areaType.toLowerCase()}_${f.id.replace(/\./g, '_')}`,
            name: f.text,
            type: areaType,
            lat: f.center[1],
            lng: f.center[0],
            original_type: f.place_type[0]
        }));
    } catch (e) {
        console.error(`Mapbox fetch failed for ${query}:`, e.message);
        return [];
    }
}

/**
 * Main Async Generator: Discover real zones near anchor
 */
async function generateRealZonesForAnchor(anchorLat, anchorLng, radiusKm = 15) {
    const nearestCity = findNearestCity(anchorLat, anchorLng);
    if (!nearestCity) return [];

    console.log(`[Zone Discovery] Searching near ${nearestCity.name} for real locations...`);

    // Parallel searches for different zone types - scoped for variety
    const [residential, commercial, industrial, institutional, healthcare, buildings, complexes] = await Promise.all([
        fetchZonesByType(anchorLat, anchorLng, `Residential Sector ${nearestCity.name}`, 'Residential', 20),
        fetchZonesByType(anchorLat, anchorLng, `Commercial Block ${nearestCity.name}`, 'Commercial', 15),
        fetchZonesByType(anchorLat, anchorLng, `Industrial Area ${nearestCity.name}`, 'Industrial', 15),
        fetchZonesByType(anchorLat, anchorLng, `University College ${nearestCity.name}`, 'Institutional', 15),
        fetchZonesByType(anchorLat, anchorLng, `Hospital Medical ${nearestCity.name}`, 'Institutional', 15),
        fetchZonesByType(anchorLat, anchorLng, `Building Plaza ${nearestCity.name}`, 'Mixed-Use', 15),
        fetchZonesByType(anchorLat, anchorLng, `Market Complex ${nearestCity.name}`, 'Commercial', 20)
    ]);

    let allCandidates = [...residential, ...commercial, ...industrial, ...institutional, ...healthcare, ...buildings, ...complexes];

    // Fallback: If no specific types found, search for generic neighborhoods
    if (allCandidates.length < 5) {
        const neighborhoods = await fetchZonesByType(anchorLat, anchorLng, `neighborhood ${nearestCity.name}`, 'Mixed-Use', 10);
        allCandidates = [...allCandidates, ...neighborhoods];
    }

    // Filter by Radius and Enrich
    const validZones = allCandidates
        .map(zone => {
            const dist = calculateDistance(anchorLat, anchorLng, zone.lat, zone.lng);
            return { ...zone, distance: dist };
        })
        .filter(zone => zone.distance <= radiusKm)
        .map(zone => ({
            ...zone,
            community_context: generateCommunityContext(nearestCity, zone.type),
            seasonal_signals: generateSeasonalSignals(nearestCity, zone.type),
            nearest_city: nearestCity.name,
            city_tier: nearestCity.tier
        }));

    // Deduplicate by name and location (simple fuzzy check)
    const uniqueZones = [];
    const seenNames = new Set();

    validZones.forEach(zone => {
        if (!seenNames.has(zone.name)) {
            // Also check spatial duplicate
            const isTooClose = uniqueZones.some(existing =>
                calculateDistance(zone.lat, zone.lng, existing.lat, existing.lng) < 0.3
            );

            if (!isTooClose) {
                uniqueZones.push(zone);
                seenNames.add(zone.name);
            }
        }
    });

    return uniqueZones.sort((a, b) => a.distance - b.distance);
}

// Helper function to calculate a coordinate at a given distance and bearing
function getCoordinateAtDistanceAndBearing(lat, lng, distanceKm, bearingDeg) {
    const R = 6371; // Earth's radius in km

    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const bearingRad = (bearingDeg * Math.PI) / 180;

    const latDestRad = Math.asin(
        Math.sin(latRad) * Math.cos(distanceKm / R) +
        Math.cos(latRad) * Math.sin(distanceKm / R) * Math.cos(bearingRad)
    );

    const lngDestRad =
        lngRad +
        Math.atan2(
            Math.sin(bearingRad) * Math.sin(distanceKm / R) * Math.cos(latRad),
            Math.cos(distanceKm / R) - Math.sin(latRad) * Math.sin(latDestRad)
        );

    return {
        lat: (latDestRad * 180) / Math.PI,
        lng: (lngDestRad * 180) / Math.PI,
    };
}

// Fallback: Generate zones in a radial + grid pattern (Geometric)
function generateGeometricZones(anchorLat, anchorLng, radiusKm = 15) {
    const nearestCity = findNearestCity(anchorLat, anchorLng) || { name: 'Unknown', tier: 'tier-3', cultural_context: 'Local', festivals: [] };
    const zones = [];
    let zoneId = 1;

    const distances = [2, 5, 8, 11, 14]; // km from anchor
    const anglesPerRing = [4, 6, 8, 6, 4]; // Number of zones per ring

    distances.forEach((distance, ringIndex) => {
        const numZones = anglesPerRing[ringIndex];
        const angleStep = 360 / numZones;

        for (let i = 0; i < numZones; i++) {
            const angle = angleStep * i;
            const { lat, lng } = getCoordinateAtDistanceAndBearing(anchorLat, anchorLng, distance, angle);

            // Simple geometric classification
            const areaType = (distance < 5) ? 'Commercial' : (distance < 10 ? 'Residential' : 'Industrial');

            const exactDistance = calculateDistance(anchorLat, anchorLng, lat, lng);

            if (exactDistance <= radiusKm) {
                zones.push({
                    id: `geometric_${Date.now()}_${zoneId}`,
                    name: `${nearestCity.name} ${areaType} Zone ${zoneId}`,
                    type: areaType,
                    lat: parseFloat(lat.toFixed(6)),
                    lng: parseFloat(lng.toFixed(6)),
                    community_context: 'Approximate estimated zone',
                    seasonal_signals: 'General seasonal trends apply',
                    distance: exactDistance,
                    nearest_city: nearestCity.name,
                    city_tier: nearestCity.tier
                });
                zoneId++;
            }
        }
    });
    return zones.sort((a, b) => a.distance - b.distance);
}



/**
 * STRATEGY 2: Gemini-Driven Discovery
 * 1. Ask Gemini for popular areas directly.
 * 2. Geocode them to check if they exist.
 */
async function fetchZonesViaGemini(anchorLat, anchorLng, cityName) {
    console.log(`[Intel] Asking Gemini for popular areas in ${cityName}...`);

    // 1. Get objects (name + type) from Gemini
    const suggestions = await suggestZoneNames(cityName, anchorLat, anchorLng);
    if (!suggestions || suggestions.length === 0) return [];

    console.log(`[Intel] Gemini suggested: ${suggestions.map(s => s.name).join(', ')}`);

    // 2. Validate availability via Mapbox
    // Parallelize the geocoding checks
    const promises = suggestions.map(async (item) => {
        let name, type;
        if (typeof item === 'string') {
            name = item;
            type = 'Mixed-Use';
        } else {
            name = item.name;
            type = item.type || 'Mixed-Use';
        }
        // Search specifically for this name in this city
        const candidates = await fetchZonesByType(anchorLat, anchorLng, `${name}, ${cityName}`, type, 1);
        if (candidates.length > 0) {
            return { ...candidates[0], type: type, name: name };
        }
        return null;
    });

    const results = await Promise.all(promises);
    const valid = results.filter(r => r !== null);
    console.log(`[Intel] Gemini Geocoding: ${valid.length}/${suggestions.length} names successfully mapped.`);
    return valid;
}

// ASYNC wrapper for zones retrieval
async function getZonesWithinRadius(anchorLat, anchorLng, radiusKm = 15, preSeededZones = []) {
    // 1. Check pre-seeded matches
    const preSeededMatches = preSeededZones
        .map(zone => ({
            ...zone,
            distance: calculateDistance(anchorLat, anchorLng, zone.lat, zone.lng)
        }))
        .filter(zone => zone.distance <= radiusKm);

    // Context: Check how far we are from a known city
    const nearestCity = findNearestCity(anchorLat, anchorLng);
    const distanceToCity = nearestCity ? nearestCity.distance : Infinity;
    const isRemote = distanceToCity > 50; // 50km threshold

    // 2. Fetch Real Zones (Async) with GEMINI-FIRST Fallback
    let dynamicZones = [];
    try {
        console.log(`[Intel] Attempting Mapbox discovery for ${anchorLat}, ${anchorLng}`);
        dynamicZones = await generateRealZonesForAnchor(anchorLat, anchorLng, radiusKm);

        // If few results found, use GEMINI to find more (Higher threshold to ensure density)
        if (dynamicZones.length < 15 && !isRemote) {
            console.log(`[Intel] High-density target not met (${dynamicZones.length}/15). Asking Gemini for hyper-local help...`);
            const geminiZones = await fetchZonesViaGemini(anchorLat, anchorLng, nearestCity.name);

            // Enrich Gemini zones
            const enrichedGeminiZones = geminiZones.map(zone => ({
                ...zone,
                community_context: generateCommunityContext(nearestCity, zone.type),
                seasonal_signals: generateSeasonalSignals(nearestCity, zone.type),
                nearest_city: nearestCity.name,
                city_tier: nearestCity.tier,
                distance: calculateDistance(anchorLat, anchorLng, zone.lat, zone.lng)
            })).filter(z => z.distance <= radiusKm);

            dynamicZones = [...dynamicZones, ...enrichedGeminiZones];
        }

        // STRATEGY 3: Augment with Broad POI Discovery if we still have few zones
        if (dynamicZones.length < 25 && !isRemote) {
            console.log(`[Intel] Final density check (${dynamicZones.length}/25). Running radial probe searches...`);

            // Proactive jittering: Search at different points around the anchor to hit different POIs
            const searchPoints = [
                { lat: anchorLat, lng: anchorLng },
                getCoordinateAtDistanceAndBearing(anchorLat, anchorLng, 3, 45),
                getCoordinateAtDistanceAndBearing(anchorLat, anchorLng, 3, 225)
            ];

            const probePromises = searchPoints.map(p => Promise.all([
                fetchZonesByType(p.lat, p.lng, `Market`, 'Commercial', 15),
                fetchZonesByType(p.lat, p.lng, `Industrial`, 'Industrial', 10),
                fetchZonesByType(p.lat, p.lng, `Sector`, 'Residential', 20),
                fetchZonesByType(p.lat, p.lng, `Building`, 'Mixed-Use', 15)
            ]));

            const allProbeResults = (await Promise.all(probePromises)).flat(2);

            const broadZones = allProbeResults.map(z => ({
                ...z,
                community_context: 'Identified local point of interest',
                seasonal_signals: 'Standard seasonal trends',
                nearest_city: nearestCity.name,
                city_tier: nearestCity.tier,
                distance: calculateDistance(anchorLat, anchorLng, z.lat, z.lng)
            })).filter(z => z.distance <= radiusKm);

            dynamicZones = [...dynamicZones, ...broadZones];
        }

    } catch (error) {
        console.error("Failed to generate real zones...", error.message);
        if (!isRemote) {
            dynamicZones = generateGeometricZones(anchorLat, anchorLng, radiusKm);
        }
    }

    // 3. Merge (Pre-seeded first)
    const allZones = [...preSeededMatches, ...dynamicZones];

    // 4. Final Dedupe - Prevent overcrowding (Max 3 in a 2.5km radius)
    const uniqueZones = [];
    allZones.forEach(zone => {
        // First check for absolute duplicates (exact same spot)
        const isOverlap = uniqueZones.some(existing =>
            calculateDistance(zone.lat, zone.lng, existing.lat, existing.lng) < 0.5
        );
        if (isOverlap) return;

        // Check cluster density (Max 3 within 2.5km)
        const nearbyCount = uniqueZones.filter(existing =>
            calculateDistance(zone.lat, zone.lng, existing.lat, existing.lng) < 2.5
        ).length;

        if (nearbyCount < 3) {
            uniqueZones.push(zone);
        }
    });

    // Final global limit to keep performance stable
    const finalZones = uniqueZones.slice(0, 18);

    console.log(`[Location Intel] De-clustered Final Zone Count: ${finalZones.length}`);
    return finalZones.sort((a, b) => a.distance - b.distance);
}

module.exports = {
    getZonesWithinRadius,
    calculateDistance
};
