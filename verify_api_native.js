const testAddProduct = async () => {
    const url = 'http://localhost:5000/api/inventory/products';
    const payload = {
        name: `Fetch Test Product ${Date.now()}`,
        sku: `FETCH-${Date.now()}`,
        category: 'Test',
        unit_price: 150,
        current_stock: 25
    };

    console.log("Testing API with payload:", payload);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Success! API Response:", data);
    } catch (err) {
        console.error("❌ Failed!", err.message);
    }
};

testAddProduct();
