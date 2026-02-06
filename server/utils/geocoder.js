const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * Resolve precise micro-location name from coordinates
 * Returns formatted string: "Sector/Block, Locality"
 * Filters out specific addresses for privacy
 */
async function resolveMicroLocation(lat, lng) {
    if (!MAPBOX_TOKEN) {
        console.warn('Mapbox token missing in backend');
        return null;
    }

    try {
        // Request specific types to ensure aggregated level data
        // types: neighborhood, locality, place, district
        const url = `${BASE_URL}/${lng},${lat}.json?types=neighborhood,locality,place,district&access_token=${MAPBOX_TOKEN}`;

        const response = await axios.get(url);

        if (!response.data || !response.data.features || response.data.features.length === 0) {
            return null;
        }

        // Feature priority: Neighborhood > Locality > Place
        const features = response.data.features;

        const neighborhood = features.find(f => f.place_type.includes('neighborhood'));
        const locality = features.find(f => f.place_type.includes('locality'));
        const place = features.find(f => f.place_type.includes('place'));
        const district = features.find(f => f.place_type.includes('district'));

        // Best resolution strategy
        // 1. "Sector 17, Vashi" (Neighborhood + Locality)
        if (neighborhood && locality) {
            return `${neighborhood.text}, ${locality.text}`;
        }

        // 2. "Vashi, Navi Mumbai" (Locality + Place)
        if (locality && place) {
            return `${locality.text}, ${place.text}`;
        }

        // 3. Fallback to just locality or place
        if (neighborhood) return neighborhood.text;
        if (locality) return locality.text;
        if (place) return place.text;
        if (district) return district.text;

        // Ultimate fallback
        return features[0].text;

    } catch (error) {
        console.error('Geocoding error:', error.message);
        return null;
    }
}

module.exports = { resolveMicroLocation };
