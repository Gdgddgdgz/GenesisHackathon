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

module.exports = { generateRestockMessage };
