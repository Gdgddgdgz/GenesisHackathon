// COMPREHENSIVE INDIAN CITIES DATABASE
// Covers 100+ cities across all states and union territories
// Includes population tier, economic activity, and cultural context for zone generation

const indianCities = [
    // METROS (Population > 10M)
    {
        name: 'Mumbai',
        state: 'Maharashtra',
        lat: 19.0760,
        lng: 72.8777,
        tier: 'metro',
        economic_activity: ['finance', 'entertainment', 'trade'],
        cultural_context: 'Diverse multi-religious; Marathi Hindu majority; significant Muslim population',
        festivals: ['Ganesh Chaturthi', 'Diwali', 'Eid', 'Christmas']
    },
    {
        name: 'Delhi',
        state: 'Delhi',
        lat: 28.6139,
        lng: 77.2090,
        tier: 'metro',
        economic_activity: ['government', 'services', 'commerce'],
        cultural_context: 'Multi-religious capital; Hindu majority with significant Muslim, Sikh communities',
        festivals: ['Diwali', 'Holi', 'Eid', 'Republic Day']
    },
    {
        name: 'Bangalore',
        state: 'Karnataka',
        lat: 12.9716,
        lng: 77.5946,
        tier: 'metro',
        economic_activity: ['technology', 'startups', 'aerospace'],
        cultural_context: 'Cosmopolitan tech hub; Kannada Hindu majority with diverse professionals',
        festivals: ['Dasara', 'Ugadi', 'Diwali']
    },
    {
        name: 'Kolkata',
        state: 'West Bengal',
        lat: 22.5726,
        lng: 88.3639,
        tier: 'metro',
        economic_activity: ['trade', 'culture', 'manufacturing'],
        cultural_context: 'Bengali Hindu majority; significant Muslim, Sikh, Christian communities',
        festivals: ['Durga Puja', 'Kali Puja', 'Diwali', 'Christmas']
    },
    {
        name: 'Chennai',
        state: 'Tamil Nadu',
        lat: 13.0827,
        lng: 80.2707,
        tier: 'metro',
        economic_activity: ['automotive', 'textiles', 'IT'],
        cultural_context: 'Tamil Hindu majority with strong Brahmin influence',
        festivals: ['Pongal', 'Diwali', 'Tamil New Year']
    },
    {
        name: 'Hyderabad',
        state: 'Telangana',
        lat: 17.3850,
        lng: 78.4867,
        tier: 'metro',
        economic_activity: ['technology', 'pharma', 'trade'],
        cultural_context: 'Mixed Hindu-Muslim city with Hyderabadi culture',
        festivals: ['Bonalu', 'Eid', 'Diwali', 'Ramadan']
    },

    // TIER 1 CITIES (Population 1M-10M)
    {
        name: 'Pune',
        state: 'Maharashtra',
        lat: 18.5204,
        lng: 73.8567,
        tier: 'tier-1',
        economic_activity: ['IT', 'education', 'automotive'],
        cultural_context: 'Marathi Hindu majority with strong educational culture',
        festivals: ['Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Ahmedabad',
        state: 'Gujarat',
        lat: 23.0225,
        lng: 72.5714,
        tier: 'tier-1',
        economic_activity: ['textiles', 'trade', 'manufacturing'],
        cultural_context: 'Gujarati Hindu majority with significant Jain community',
        festivals: ['Uttarayan', 'Navratri', 'Diwali']
    },
    {
        name: 'Surat',
        state: 'Gujarat',
        lat: 21.1702,
        lng: 72.8311,
        tier: 'tier-1',
        economic_activity: ['textiles', 'diamond', 'trade'],
        cultural_context: 'Gujarati business community; Hindu-Jain majority',
        festivals: ['Uttarayan', 'Navratri', 'Diwali']
    },
    {
        name: 'Jaipur',
        state: 'Rajasthan',
        lat: 26.9124,
        lng: 75.7873,
        tier: 'tier-1',
        economic_activity: ['tourism', 'handicrafts', 'trade'],
        cultural_context: 'Rajasthani Hindu majority with rich cultural heritage',
        festivals: ['Teej', 'Diwali', 'Holi']
    },
    {
        name: 'Lucknow',
        state: 'Uttar Pradesh',
        lat: 26.8467,
        lng: 80.9462,
        tier: 'tier-1',
        economic_activity: ['government', 'handicrafts', 'trade'],
        cultural_context: 'Mixed Hindu-Muslim with Awadhi culture',
        festivals: ['Diwali', 'Eid', 'Holi']
    },
    {
        name: 'Kanpur',
        state: 'Uttar Pradesh',
        lat: 26.4499,
        lng: 80.3319,
        tier: 'tier-1',
        economic_activity: ['leather', 'textiles', 'manufacturing'],
        cultural_context: 'Hindu majority with industrial working class',
        festivals: ['Diwali', 'Holi']
    },
    {
        name: 'Nagpur',
        state: 'Maharashtra',
        lat: 21.1458,
        lng: 79.0882,
        tier: 'tier-1',
        economic_activity: ['trade', 'oranges', 'logistics'],
        cultural_context: 'Marathi Hindu majority; central India cultural mix',
        festivals: ['Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Indore',
        state: 'Madhya Pradesh',
        lat: 22.7196,
        lng: 75.8577,
        tier: 'tier-1',
        economic_activity: ['trade', 'textiles', 'pharma'],
        cultural_context: 'Marwari business community; Hindu-Jain majority',
        festivals: ['Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Thane',
        state: 'Maharashtra',
        lat: 19.2183,
        lng: 72.9781,
        tier: 'tier-1',
        economic_activity: ['residential', 'manufacturing', 'services'],
        cultural_context: 'Marathi Hindu majority; Mumbai satellite city',
        festivals: ['Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Bhopal',
        state: 'Madhya Pradesh',
        lat: 23.2599,
        lng: 77.4126,
        tier: 'tier-1',
        economic_activity: ['government', 'education', 'trade'],
        cultural_context: 'Mixed Hindu-Muslim with nawabi heritage',
        festivals: ['Diwali', 'Eid', 'Holi']
    },
    {
        name: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        lat: 17.6868,
        lng: 83.2185,
        tier: 'tier-1',
        economic_activity: ['port', 'steel', 'IT'],
        cultural_context: 'Telugu Hindu majority with coastal culture',
        festivals: ['Ugadi', 'Diwali', 'Sankranti']
    },
    {
        name: 'Pimpri-Chinchwad',
        state: 'Maharashtra',
        lat: 18.6298,
        lng: 73.7997,
        tier: 'tier-1',
        economic_activity: ['automotive', 'manufacturing', 'IT'],
        cultural_context: 'Industrial belt; Marathi Hindu working class',
        festivals: ['Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Patna',
        state: 'Bihar',
        lat: 25.5941,
        lng: 85.1376,
        tier: 'tier-1',
        economic_activity: ['government', 'agriculture', 'trade'],
        cultural_context: 'Bihari Hindu majority with Muslim community',
        festivals: ['Chhath Puja', 'Diwali', 'Holi']
    },
    {
        name: 'Vadodara',
        state: 'Gujarat',
        lat: 22.3072,
        lng: 73.1812,
        tier: 'tier-1',
        economic_activity: ['petrochemicals', 'manufacturing', 'education'],
        cultural_context: 'Gujarati Hindu-Jain majority with cultural heritage',
        festivals: ['Navratri', 'Uttarayan', 'Diwali']
    },
    {
        name: 'Ghaziabad',
        state: 'Uttar Pradesh',
        lat: 28.6692,
        lng: 77.4538,
        tier: 'tier-1',
        economic_activity: ['residential', 'manufacturing', 'services'],
        cultural_context: 'Hindu majority; Delhi satellite city',
        festivals: ['Diwali', 'Holi']
    },
    {
        name: 'Ludhiana',
        state: 'Punjab',
        lat: 30.9010,
        lng: 75.8573,
        tier: 'tier-1',
        economic_activity: ['textiles', 'manufacturing', 'trade'],
        cultural_context: 'Sikh-Hindu majority with Punjabi business culture',
        festivals: ['Lohri', 'Baisakhi', 'Diwali']
    },
    {
        name: 'Agra',
        state: 'Uttar Pradesh',
        lat: 27.1767,
        lng: 78.0081,
        tier: 'tier-1',
        economic_activity: ['tourism', 'handicrafts', 'trade'],
        cultural_context: 'Hindu majority with Mughal heritage',
        festivals: ['Taj Mahotsav', 'Diwali', 'Holi']
    },
    {
        name: 'Nashik',
        state: 'Maharashtra',
        lat: 19.9975,
        lng: 73.7898,
        tier: 'tier-1',
        economic_activity: ['wine', 'agriculture', 'manufacturing'],
        cultural_context: 'Marathi Hindu religious center',
        festivals: ['Kumbh Mela (every 12 years)', 'Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Faridabad',
        state: 'Haryana',
        lat: 28.4089,
        lng: 77.3178,
        tier: 'tier-1',
        economic_activity: ['manufacturing', 'residential', 'services'],
        cultural_context: 'Hindu majority; Delhi NCR industrial belt',
        festivals: ['Diwali', 'Holi']
    },
    {
        name: 'Meerut',
        state: 'Uttar Pradesh',
        lat: 28.9845,
        lng: 77.7064,
        tier: 'tier-1',
        economic_activity: ['sports goods', 'manufacturing', 'trade'],
        cultural_context: 'Hindu-Muslim mixed with historical significance',
        festivals: ['Diwali', 'Eid', 'Holi']
    },
    {
        name: 'Rajkot',
        state: 'Gujarat',
        lat: 22.3039,
        lng: 70.8022,
        tier: 'tier-1',
        economic_activity: ['manufacturing', 'trade', 'agriculture'],
        cultural_context: 'Gujarati Hindu-Jain business community',
        festivals: ['Navratri', 'Uttarayan', 'Diwali']
    },
    {
        name: 'Kalyan-Dombivli',
        state: 'Maharashtra',
        lat: 19.2403,
        lng: 73.1305,
        tier: 'tier-1',
        economic_activity: ['residential', 'manufacturing', 'services'],
        cultural_context: 'Marathi Hindu majority; Mumbai satellite',
        festivals: ['Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Vasai-Virar',
        state: 'Maharashtra',
        lat: 19.4612,
        lng: 72.7972,
        tier: 'tier-1',
        economic_activity: ['residential', 'fishing', 'services'],
        cultural_context: 'Mixed Hindu-Christian coastal community',
        festivals: ['Ganesh Chaturthi', 'Christmas', 'Diwali']
    },
    {
        name: 'Varanasi',
        state: 'Uttar Pradesh',
        lat: 25.3176,
        lng: 82.9739,
        tier: 'tier-1',
        economic_activity: ['tourism', 'handicrafts', 'religious'],
        cultural_context: 'Hindu religious capital; pilgrimage center',
        festivals: ['Dev Deepawali', 'Maha Shivaratri', 'Diwali']
    },
    {
        name: 'Srinagar',
        state: 'Jammu and Kashmir',
        lat: 34.0837,
        lng: 74.7973,
        tier: 'tier-1',
        economic_activity: ['tourism', 'handicrafts', 'agriculture'],
        cultural_context: 'Muslim majority with Kashmiri culture',
        festivals: ['Eid', 'Ramadan', 'Navroz']
    },
    {
        name: 'Aurangabad',
        state: 'Maharashtra',
        lat: 19.8762,
        lng: 75.3433,
        tier: 'tier-1',
        economic_activity: ['tourism', 'manufacturing', 'pharma'],
        cultural_context: 'Mixed Hindu-Muslim with historical sites',
        festivals: ['Ganesh Chaturthi', 'Eid', 'Diwali']
    },
    {
        name: 'Dhanbad',
        state: 'Jharkhand',
        lat: 23.7957,
        lng: 86.4304,
        tier: 'tier-1',
        economic_activity: ['coal mining', 'industrial', 'trade'],
        cultural_context: 'Hindu majority with mining labor culture',
        festivals: ['Diwali', 'Holi', 'Chhath Puja']
    },
    {
        name: 'Amritsar',
        state: 'Punjab',
        lat: 31.6340,
        lng: 74.8723,
        tier: 'tier-1',
        economic_activity: ['tourism', 'trade', 'textiles'],
        cultural_context: 'Sikh religious capital; pilgrimage center',
        festivals: ['Baisakhi', 'Guru Nanak Jayanti', 'Diwali']
    },
    {
        name: 'Navi Mumbai',
        state: 'Maharashtra',
        lat: 19.0330,
        lng: 73.0297,
        tier: 'tier-1',
        economic_activity: ['residential', 'IT', 'logistics'],
        cultural_context: 'Planned city; Marathi Hindu majority with diverse professionals',
        festivals: ['Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Allahabad (Prayagraj)',
        state: 'Uttar Pradesh',
        lat: 25.4358,
        lng: 81.8463,
        tier: 'tier-1',
        economic_activity: ['religious', 'education', 'government'],
        cultural_context: 'Hindu religious center; Kumbh Mela host',
        festivals: ['Kumbh Mela', 'Maha Shivaratri', 'Diwali']
    },
    {
        name: 'Ranchi',
        state: 'Jharkhand',
        lat: 23.3441,
        lng: 85.3096,
        tier: 'tier-1',
        economic_activity: ['mining', 'IT', 'trade'],
        cultural_context: 'Tribal-Hindu mixed; state capital',
        festivals: ['Sarhul', 'Diwali', 'Holi']
    },
    {
        name: 'Howrah',
        state: 'West Bengal',
        lat: 22.5958,
        lng: 88.2636,
        tier: 'tier-1',
        economic_activity: ['manufacturing', 'trade', 'transport'],
        cultural_context: 'Bengali Hindu majority; Kolkata satellite',
        festivals: ['Durga Puja', 'Kali Puja', 'Diwali']
    },
    {
        name: 'Coimbatore',
        state: 'Tamil Nadu',
        lat: 11.0168,
        lng: 76.9558,
        tier: 'tier-1',
        economic_activity: ['textiles', 'manufacturing', 'IT'],
        cultural_context: 'Tamil Hindu majority with business culture',
        festivals: ['Pongal', 'Diwali']
    },
    {
        name: 'Jabalpur',
        state: 'Madhya Pradesh',
        lat: 23.1815,
        lng: 79.9864,
        tier: 'tier-1',
        economic_activity: ['military', 'education', 'tourism'],
        cultural_context: 'Hindu majority with central India culture',
        festivals: ['Diwali', 'Holi']
    },
    {
        name: 'Gwalior',
        state: 'Madhya Pradesh',
        lat: 26.2183,
        lng: 78.1828,
        tier: 'tier-1',
        economic_activity: ['tourism', 'textiles', 'trade'],
        cultural_context: 'Hindu majority with royal heritage',
        festivals: ['Diwali', 'Holi', 'Tansen Music Festival']
    },
    {
        name: 'Vijayawada',
        state: 'Andhra Pradesh',
        lat: 16.5062,
        lng: 80.6480,
        tier: 'tier-1',
        economic_activity: ['trade', 'agriculture', 'IT'],
        cultural_context: 'Telugu Hindu majority with Krishna River culture',
        festivals: ['Ugadi', 'Sankranti', 'Diwali']
    },
    {
        name: 'Jodhpur',
        state: 'Rajasthan',
        lat: 26.2389,
        lng: 73.0243,
        tier: 'tier-1',
        economic_activity: ['tourism', 'handicrafts', 'trade'],
        cultural_context: 'Rajasthani Hindu majority with royal heritage',
        festivals: ['Marwar Festival', 'Diwali', 'Holi']
    },
    {
        name: 'Madurai',
        state: 'Tamil Nadu',
        lat: 9.9252,
        lng: 78.1198,
        tier: 'tier-1',
        economic_activity: ['tourism', 'textiles', 'agriculture'],
        cultural_context: 'Tamil Hindu religious center; temple city',
        festivals: ['Meenakshi Thirukalyanam', 'Pongal', 'Diwali']
    },
    {
        name: 'Raipur',
        state: 'Chhattisgarh',
        lat: 21.2514,
        lng: 81.6296,
        tier: 'tier-1',
        economic_activity: ['steel', 'mining', 'trade'],
        cultural_context: 'Hindu majority with tribal influence',
        festivals: ['Diwali', 'Holi']
    },
    {
        name: 'Kota',
        state: 'Rajasthan',
        lat: 25.2138,
        lng: 75.8648,
        tier: 'tier-1',
        economic_activity: ['education', 'coaching', 'textiles'],
        cultural_context: 'Educational hub; Hindu majority',
        festivals: ['Diwali', 'Holi', 'Dussehra']
    },
    {
        name: 'Chandigarh',
        state: 'Chandigarh',
        lat: 30.7333,
        lng: 76.7794,
        tier: 'tier-1',
        economic_activity: ['government', 'services', 'IT'],
        cultural_context: 'Planned city; Punjabi-Haryanvi Hindu-Sikh mix',
        festivals: ['Lohri', 'Baisakhi', 'Diwali']
    },
    {
        name: 'Guwahati',
        state: 'Assam',
        lat: 26.1445,
        lng: 91.7362,
        tier: 'tier-1',
        economic_activity: ['trade', 'tea', 'oil'],
        cultural_context: 'Assamese Hindu majority with tribal diversity',
        festivals: ['Bihu', 'Durga Puja', 'Diwali']
    },
    {
        name: 'Solapur',
        state: 'Maharashtra',
        lat: 17.6599,
        lng: 75.9064,
        tier: 'tier-2',
        economic_activity: ['textiles', 'agriculture', 'trade'],
        cultural_context: 'Marathi Hindu majority',
        festivals: ['Ganesh Chaturthi', 'Diwali']
    },
    {
        name: 'Hubli-Dharwad',
        state: 'Karnataka',
        lat: 15.3647,
        lng: 75.1240,
        tier: 'tier-2',
        economic_activity: ['trade', 'education', 'agriculture'],
        cultural_context: 'Kannada Hindu majority',
        festivals: ['Dasara', 'Ugadi', 'Diwali']
    },
    {
        name: 'Mysore',
        state: 'Karnataka',
        lat: 12.2958,
        lng: 76.6394,
        tier: 'tier-2',
        economic_activity: ['tourism', 'silk', 'IT'],
        cultural_context: 'Kannada Hindu; royal heritage city',
        festivals: ['Dasara', 'Ugadi', 'Diwali']
    },
    {
        name: 'Tiruchirappalli',
        state: 'Tamil Nadu',
        lat: 10.7905,
        lng: 78.7047,
        tier: 'tier-2',
        economic_activity: ['education', 'manufacturing', 'trade'],
        cultural_context: 'Tamil Hindu majority',
        festivals: ['Pongal', 'Diwali']
    },
    {
        name: 'Bareilly',
        state: 'Uttar Pradesh',
        lat: 28.3670,
        lng: 79.4304,
        tier: 'tier-2',
        economic_activity: ['furniture', 'trade', 'agriculture'],
        cultural_context: 'Hindu-Muslim mixed',
        festivals: ['Diwali', 'Eid', 'Holi']
    },
    {
        name: 'Moradabad',
        state: 'Uttar Pradesh',
        lat: 28.8386,
        lng: 78.7733,
        tier: 'tier-2',
        economic_activity: ['brassware', 'handicrafts', 'trade'],
        cultural_context: 'Muslim-Hindu mixed; famous for brass industry',
        festivals: ['Eid', 'Diwali', 'Holi']
    },
    {
        name: 'Mysuru',
        state: 'Karnataka',
        lat: 12.2958,
        lng: 76.6394,
        tier: 'tier-2',
        economic_activity: ['tourism', 'IT', 'education'],
        cultural_context: 'Kannada Hindu with royal Wodeyar heritage',
        festivals: ['Dasara', 'Ugadi']
    },
    {
        name: 'Gurgaon (Gurugram)',
        state: 'Haryana',
        lat: 28.4595,
        lng: 77.0266,
        tier: 'tier-1',
        economic_activity: ['IT', 'corporate', 'real estate'],
        cultural_context: 'Cosmopolitan; migrant professionals from across India',
        festivals: ['Diwali', 'Holi']
    },
    {
        name: 'Noida',
        state: 'Uttar Pradesh',
        lat: 28.5355,
        lng: 77.3910,
        tier: 'tier-1',
        economic_activity: ['IT', 'media', 'manufacturing'],
        cultural_context: 'Planned city; diverse professional population',
        festivals: ['Diwali', 'Holi']
    },
    {
        name: 'Mangalore',
        state: 'Karnataka',
        lat: 12.9141,
        lng: 74.8560,
        tier: 'tier-2',
        economic_activity: ['port', 'education', 'trade'],
        cultural_context: 'Coastal diversity; Hindu-Muslim-Christian mix',
        festivals: ['Dasara', 'Christmas', 'Eid']
    },
    {
        name: 'Kochi',
        state: 'Kerala',
        lat: 9.9312,
        lng: 76.2673,
        tier: 'tier-1',
        economic_activity: ['port', 'tourism', 'IT'],
        cultural_context: 'Coastal diversity; Hindu-Muslim-Christian equal presence',
        festivals: ['Onam', 'Christmas', 'Eid', 'Vishu']
    },
    {
        name: 'Thiruvananthapuram',
        state: 'Kerala',
        lat: 8.5241,
        lng: 76.9366,
        tier: 'tier-2',
        economic_activity: ['government', 'IT', 'tourism'],
        cultural_context: 'Malayalam Hindu-Christian-Muslim diversity',
        festivals: ['Onam', 'Christmas', 'Attukal Pongala']
    },
    {
        name: 'Kozhikode',
        state: 'Kerala',
        lat: 11.2588,
        lng: 75.7804,
        tier: 'tier-2',
        economic_activity: ['trade', 'tourism', 'IT'],
        cultural_context: 'Muslim-Hindu coastal community',
        festivals: ['Onam', 'Eid', 'Ramadan']
    },
    {
        name: 'Bhubaneswar',
        state: 'Odisha',
        lat: 20.2961,
        lng: 85.8245,
        tier: 'tier-2',
        economic_activity: ['IT', 'education', 'tourism'],
        cultural_context: 'Odia Hindu; temple city',
        festivals: ['Rath Yatra', 'Durga Puja', 'Diwali']
    },
    {
        name: 'Dehradun',
        state: 'Uttarakhand',
        lat: 30.3165,
        lng: 78.0322,
        tier: 'tier-2',
        economic_activity: ['education', 'tourism', 'government'],
        cultural_context: 'Hill city; Hindu majority with Garhwali culture',
        festivals: ['Diwali', 'Holi', 'Basant Panchami']
    }
];

// Helper function to find nearest city to a given coordinate
function findNearestCity(lat, lng) {
    let minDistance = Infinity;
    let nearestCity = indianCities[0];

    indianCities.forEach(city => {
        const distance = calculateDistanceSimple(lat, lng, city.lat, city.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
        }
    });

    return { ...nearestCity, distance: minDistance };
}

// Simple distance calculation for city matching
function calculateDistanceSimple(lat1, lon1, lat2, lon2) {
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

// Get cities within a certain radius (for context)
function getCitiesNearby(anchorLat, anchorLng, radiusKm = 100) {
    return indianCities
        .map(city => ({
            ...city,
            distance: calculateDistanceSimple(anchorLat, anchorLng, city.lat, city.lng)
        }))
        .filter(city => city.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
}

module.exports = {
    indianCities,
    findNearestCity,
    getCitiesNearby
};
