// MOCK GEOSPATIAL ZONE DATABASE FOR INDIA
// Each zone represents a classified area with community/cultural context

const zones = [
    // MUMBAI ZONES
    {
        id: 'mum_001',
        name: 'Vidyavihar East',
        type: 'Residential',
        lat: 19.0822,
        lng: 72.8978,
        community_context: 'Hindu-majority area with significant Marathi-speaking population',
        seasonal_signals: 'Ganesh Chaturthi (Sept), Diwali demand spike'
    },
    {
        id: 'mum_002',
        name: 'Bhendi Bazaar',
        type: 'Mixed-Use',
        lat: 18.9542,
        lng: 72.8318,
        community_context: 'Muslim-majority commercial hub',
        seasonal_signals: 'Ramadan, Eid-related activity; traditional textile trade'
    },
    {
        id: 'mum_003',
        name: 'BKC (Bandra Kurla Complex)',
        type: 'Commercial',
        lat: 19.0606,
        lng: 72.8688,
        community_context: 'Corporate business district; affluent professionals',
        seasonal_signals: 'Year-round office supplies, premium F&B demand'
    },
    {
        id: 'mum_004',
        name: 'Dharavi',
        type: 'Mixed-Use',
        lat: 19.0410,
        lng: 72.8570,
        community_context: 'High-density informal settlement; diverse industries',
        seasonal_signals: 'Festival-based consumption peaks; micro-enterprise activity'
    },
    {
        id: 'mum_005',
        name: 'Chembur East',
        type: 'Residential',
        lat: 19.0522,
        lng: 72.8978,
        community_context: 'Mixed Hindu-Muslim residential area',
        seasonal_signals: 'Wedding season (Nov-Feb), festival cycles'
    },
    {
        id: 'mum_006',
        name: 'Andheri West',
        type: 'Commercial',
        lat: 19.1368,
        lng: 72.8289,
        community_context: 'Entertainment industry hub; young professionals',
        seasonal_signals: 'Film production cycles, nightlife economy'
    },
    {
        id: 'mum_inst_001',
        name: 'IIT Bombay Campus',
        type: 'Institutional',
        lat: 19.1334,
        lng: 72.9133,
        community_context: 'Premier academic institute; high density of students and faculty',
        seasonal_signals: 'Academic semester cycles; tech festival peaks (Mood Indigo)'
    },
    {
        id: 'mum_inst_002',
        name: 'Tata Memorial Hospital Area',
        type: 'Institutional',
        lat: 19.0048,
        lng: 72.8427,
        community_context: 'Healthcare hub; Parel medical district; mix of patients and professionals',
        seasonal_signals: 'Year-round medical supply demand; health awareness months'
    },

    // DELHI ZONES
    {
        id: 'del_001',
        name: 'Chandni Chowk',
        type: 'Mixed-Use',
        lat: 28.6506,
        lng: 77.2303,
        community_context: 'Old Delhi commercial center; diverse religious communities',
        seasonal_signals: 'Diwali wholesale rush, wedding shopping'
    },
    {
        id: 'del_002',
        name: 'Connaught Place',
        type: 'Commercial',
        lat: 28.6315,
        lng: 77.2167,
        community_context: 'Central business district; tourism hotspot',
        seasonal_signals: 'Tourist season (Oct-Mar), corporate Q4 activity'
    },
    {
        id: 'del_003',
        name: 'Jamia Nagar',
        type: 'Residential',
        lat: 28.5613,
        lng: 77.2822,
        community_context: 'Muslim-majority residential area near Jamia Millia University',
        seasonal_signals: 'Ramadan, Eid preparations; education-related demand'
    },
    {
        id: 'del_004',
        name: 'Dwarka Sector 10',
        type: 'Residential',
        lat: 28.5921,
        lng: 77.0460,
        community_context: 'Planned residential suburb; middle-class families',
        seasonal_signals: 'School season supplies, festival retail'
    },

    // BANGALORE ZONES
    {
        id: 'blr_001',
        name: 'Koramangala',
        type: 'Mixed-Use',
        lat: 12.9352,
        lng: 77.6245,
        community_context: 'Startup hub; young tech professionals',
        seasonal_signals: 'Year-round co-working supplies, cafe culture'
    },
    {
        id: 'blr_002',
        name: 'Shivajinagar',
        type: 'Commercial',
        lat: 12.9855,
        lng: 77.6035,
        community_context: 'Muslim-majority commercial area',
        seasonal_signals: 'Ramadan business cycles, traditional retail'
    },
    {
        id: 'blr_003',
        name: 'Whitefield',
        type: 'Commercial',
        lat: 12.9698,
        lng: 77.7500,
        community_context: 'IT corridor; multinational offices',
        seasonal_signals: 'Corporate procurement cycles, expat demand'
    },

    // CHENNAI ZONES
    {
        id: 'che_001',
        name: 'T Nagar',
        type: 'Commercial',
        lat: 13.0418,
        lng: 80.2341,
        community_context: 'Major textile and jewelry hub; Tamil Hindu majority',
        seasonal_signals: 'Pongal (Jan), wedding season demand'
    },
    {
        id: 'che_002',
        name: 'Anna Nagar',
        type: 'Residential',
        lat: 13.0878,
        lng: 80.2088,
        community_context: 'Affluent residential area; Tamil Brahmin concentration',
        seasonal_signals: 'Temple festival cycles, cultural events'
    },

    // KOLKATA ZONES
    {
        id: 'kol_001',
        name: 'Park Street',
        type: 'Commercial',
        lat: 22.5542,
        lng: 88.3516,
        community_context: 'Premier commercial district; Christian minority presence',
        seasonal_signals: 'Christmas trade, New Year celebrations'
    },
    {
        id: 'kol_002',
        name: 'Burrabazar',
        type: 'Mixed-Use',
        lat: 22.5726,
        lng: 88.3639,
        community_context: 'Wholesale market; Marwari business community',
        seasonal_signals: 'Durga Puja (Sept-Oct), Diwali wholesale trading'
    }
];

// Haversine distance calculation (in km)
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

// Get zones within radius of anchor point (now uses dynamic generation)
async function getZonesWithinRadius(anchorLat, anchorLng, radiusKm = 15) {
    const { getZonesWithinRadius: getDynamicZones } = require('../utils/zone-generator');
    return await getDynamicZones(anchorLat, anchorLng, radiusKm, zones);
}

module.exports = {
    zones,
    getZonesWithinRadius,
    calculateDistance
};
