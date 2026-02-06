const axios = require('axios');

const testAddProduct = async () => {
    const url = 'http://localhost:5000/api/inventory/products';
    const payload = {
        name: `Test Product ${Date.now()}`,
        sku: `TEST-${Date.now()}`,
        category: 'Test',
        unit_price: 100,
        current_stock: 50
    };

    console.log("Testing API with payload:", payload);

    try {
        const res = await axios.post(url, payload);
        console.log("✅ Success! API Response:", res.data);
    } catch (err) {
        console.error("❌ Failed!", err.response ? err.response.data : err.message);
    }
};

testAddProduct();
