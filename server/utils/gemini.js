const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSy...");

const generateRestockMessage = async (productName, currentStock, minLevel, unitPrice, requiredQty = 50) => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return `[MOCK AI] Requesting restock for ${productName}. Current: ${currentStock}, Threshold: ${minLevel}, Cost: ₹${unitPrice}/unit. Please send ${requiredQty} units immediately.`;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `You are an automated inventory assistant for an SME. 
        Product: "${productName}"
        Current Stock: ${currentStock} units
        Minimum Threshold: ${minLevel} units
        Last Known Unit Price: ₹${unitPrice}
        Quantity to Order: ${requiredQty} units

        Write a professional and concise WhatsApp/Email message to the vendor requesting an immediate restock of ${requiredQty} units. 
        Mention the last known price of ₹${unitPrice} per unit to confirm consistency. 
        The tone should be professional, urgent, and clear.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return `Urgent: Restock needed for ${productName}. Current stock is ${currentStock} units. Required: ${requiredQty} units at ₹${unitPrice}/unit.`;
    }
};

const generateLocationInsight = async (zoneData, inventoryContext = null) => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return formatInsightFallback(zoneData);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Build Inventory Context string
        let inventoryStr = "Inventory Data: No critical alerts.";
        if (inventoryContext && inventoryContext.lowStock && inventoryContext.lowStock.length > 0) {
            inventoryStr = `Inventory Alerts: Higher demand detected for ${inventoryContext.lowStock.map(i => `${i.name} (${i.stock}/${i.min})`).join(', ')}.`;
        }

        // Enhanced prompt with stricter formatting requirements
        const prompt = `You are a location intelligence AI for India. Generate an actionable business insight for this zone.

ZONE DATA:
- Type: ${zoneData.type}
- Distance from Anchor: ${zoneData.distance.toFixed(1)} km
- Nearest City: ${zoneData.nearest_city || 'Unknown'}
- Community Context: ${zoneData.community_context}
- Seasonal Patterns: ${zoneData.seasonal_signals}
- Zone Name: ${zoneData.name}

${inventoryStr}

STRICT OUTPUT FORMAT (Must be EXACTLY 3 lines):
Line 1: [${zoneData.type}] Zone — ${zoneData.distance.toFixed(1)} km from anchor
Line 2: Aggregated community context + inventory interaction (if applicable).
Line 3: Recommended Action: Specific step related to stock or spatial placement.

RULES:
- Line 1 MUST start with "[${zoneData.type}] Zone —"
- Line 2 MUST describe aggregated community patterns and mention inventory if alerts exist.
- Line 3 MUST start with "Recommended Action:"
- TOTAL OUTPUT: exactly 3 lines, no more, no less
- NO personal data, NO individual targeting, ONLY population-level insights

Generate the insight now:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedText = response.text().trim();

        // Validate and fix formatting if needed
        generatedText = validateAndFixFormat(generatedText, zoneData);

        return generatedText;
    } catch (error) {
        console.error("Gemini Location Insight Error:", error);
        return formatInsightFallback(zoneData);
    }
};

// Validate Gemini output and fix common formatting issues
function validateAndFixFormat(text, zoneData) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Check if we have exactly 3 lines
    if (lines.length !== 3) {
        console.warn(`Gemini returned ${lines.length} lines instead of 3. Using fallback.`);
        return formatInsightFallback(zoneData);
    }

    // Validate line 1 format
    const expectedStart = `[${zoneData.type}] Zone`;
    if (!lines[0].startsWith(expectedStart)) {
        lines[0] = `[${zoneData.type}] Zone — ${zoneData.distance.toFixed(1)} km from anchor`;
    }

    // Validate line 3 has "Recommended Action"
    if (!lines[2].includes('Recommended Action')) {
        lines[2] = `Recommended Action: ${lines[2]}`;
    }

    return lines.join('\n');
}

// Fallback insight formatter for when Gemini fails or is unavailable
function formatInsightFallback(zoneData) {
    const line1 = `[${zoneData.type}] Zone — ${zoneData.distance.toFixed(1)} km from anchor`;
    const line2 = zoneData.community_context || 'Mixed community with diverse demographics';

    // Generate action based on area type
    let action = '';
    switch (zoneData.type) {
        case 'Residential':
            action = 'Target door-to-door marketing and local grocery partnerships for household goods.';
            break;
        case 'Commercial':
            action = 'Focus on B2B outreach and bulk supply agreements with local businesses.';
            break;
        case 'Mixed-Use':
            action = 'Deploy hybrid strategy combining residential flyers and commercial partnerships.';
            break;
        case 'Industrial':
            action = 'Target wholesale supply to manufacturing units and worker canteens.';
            break;
        case 'Institutional':
            action = 'Focus on contract supplies for canteen services, stationery, and bulk maintenance goods.';
            break;
        default:
            action = 'Analyze local demand patterns and establish supply chain presence.';
    }
    const line3 = `Recommended Action: ${action}`;

    return `${line1}\n${line2}\n${line3}`;
}

// Generate specific insight for a resolved micro-location
const generateSpecificLocationInsight = async (locationName, zoneData, inventoryContext = null) => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return formatSpecificInsightFallback(locationName, zoneData);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        let inventoryStr = "Inventory Status: Stable.";
        if (inventoryContext && inventoryContext.lowStock && inventoryContext.lowStock.length > 0) {
            inventoryStr = `LOW STOCK ALERT: ${inventoryContext.lowStock.map(i => `${i.name}`).join(', ')} are running low.`;
        }

        const prompt = `You are a hyperlocal business intelligence AI.
        
        TARGET LOCATION: "${locationName}"
        AREA TYPE: ${zoneData.type}
        DISTANCE: ${zoneData.distance.toFixed(1)} km from anchor
        CONTEXT: ${zoneData.community_context}
        ${inventoryStr}

        Generate a specific business insight for this EXACT micro-location. Correlate the location type with current stock alerts if applicable.

        STRICT OUTPUT FORMAT (Must be EXACTLY 3 lines):
        Line 1: [${locationName}] — [${zoneData.type}]
        Line 2: Hyper-local context combined with inventory/demand signals.
        Line 3: Recommended Action: Specific business or logistics step.

        RULES:
        - Line 1 MUST start with "[${locationName}]"
        - Line 3 MUST start with "Recommended Action:"
        - BE SPECIFIC. If stock is low, recommend restock or local promotions.
        - NO personal data, NO individual targeting.

        Generate now:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedText = response.text().trim();

        // Validate
        const lines = generatedText.split('\n').filter(line => line.trim().length > 0);
        if (lines.length !== 3) {
            return formatSpecificInsightFallback(locationName, zoneData);
        }

        return generatedText;

    } catch (error) {
        console.error("Gemini Specific Insight Error:", error);
        return formatSpecificInsightFallback(locationName, zoneData);
    }
};

function formatSpecificInsightFallback(locationName, zoneData) {
    const line1 = `[${locationName}] — [${zoneData.type}]`;
    const line2 = zoneData.community_context || 'Mixed activity area with diverse demographics.';
    let action = 'Analyze local demand patterns.';

    if (zoneData.type === 'Residential') action = 'Target household essentials and home delivery services.';
    if (zoneData.type === 'Commercial') action = 'Focus on B2B partnerships and office supply contracts.';
    if (zoneData.type === 'Industrial') action = 'Supply safety equipment and bulk industrial consumables.';
    if (zoneData.type === 'Institutional') action = 'Establish service contracts for healthcare or educational facilities.';

    const line3 = `Recommended Action: ${action}`;
    return `${line1}\n${line2}\n${line3}`;
}

// Suggest popular zones/neighborhoods in a city (for discovery)
const suggestZoneNames = async (cityName, lat, lng) => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return [`${cityName} Central Market`, `${cityName} Industrial Area`, `${cityName} Extension`];
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a hyper-local geography expert for ${cityName}, India.
        Identify 15-20 EXACT, SPECIFIC land-based micro-locations (Housing Sectors, Blocks, Bazaars, Industrial Parks, Corporate Towers, Gated Societies) near coordinates (${lat}, ${lng}).
        
        CRITICAL RULES:
        1. NO Generic City Names: Do NOT return "${cityName}" as a location name.
        2. HYPER-SPECIFIC: Focus on "Sector X", "Block Y", "Complex", "Mall", "Plaza", "MIDC", or "Industrial Estate".
        3. LAND ONLY: Do not suggest names of rivers, creeks, or generic regions that center in water.
        4. BALANCE: Provide a mix of Residential, Commercial, Institutional, and Industrial areas.
        
        RETURN ONLY A RAW JSON ARRAY of objects with "name" and "type".
        Type MUST be one of: "Residential", "Commercial", "Institutional", "Mixed-Use", "Industrial"

        Example: [{"name": "Sector 11, CBD Belapur", "type": "Residential"}, {"name": "Laxmi Business Park", "type": "Commercial"}, {"name": "IIT Bombay Campus", "type": "Institutional"}, {"name": "MIDC Phase 2", "type": "Industrial"}]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const suggestions = JSON.parse(text);
        return suggestions.filter(s => s.name && s.type);
    } catch (error) {
        console.error("Gemini Zone Suggestion Error:", error);
        // Robust fallback with multi-type coverage for large Indian cities
        return [
            { name: `${cityName} Market`, type: 'Commercial' },
            { name: `New ${cityName} Colony`, type: 'Residential' },
            { name: `${cityName} Civil Lines`, type: 'Mixed-Use' },
            { name: `${cityName} Industrial Estate`, type: 'Industrial' },
            { name: `${cityName} Model Town`, type: 'Residential' },
            { name: `${cityName} Station Road`, type: 'Commercial' },
            { name: `${cityName} Extension`, type: 'Residential' },
            { name: `${cityName} Bypass Road`, type: 'Industrial' },
            { name: `${cityName} Housing Society`, type: 'Residential' },
            { name: `${cityName} Nagar`, type: 'Residential' },
            { name: `${cityName} Smart City`, type: 'Mixed-Use' }
        ];
    }
};

module.exports = { generateRestockMessage, generateLocationInsight, generateSpecificLocationInsight, suggestZoneNames };
