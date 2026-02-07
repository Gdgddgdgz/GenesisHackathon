async function testStockDeduction() {
    console.log("--- Real-Time Stock Deduction Verification ---");
    // Use the temporary port if we started a new instance, otherwise try 5000
    const port = process.env.TEST_PORT || 5000;
    const baseUrl = `http://localhost:${port}/api`;

    try {
        // 1. Get Initial Stock
        console.log(`\n[1/4] Checking initial stock (using PORT ${port})...`);
        const prodRes = await fetch(`${baseUrl}/inventory/products`);
        const products = await prodRes.json();
        const salt = products.find(p => p.id === 1);
        console.log(`Initial Stock (TATA Salt): ${salt.current_stock}`);

        // 2. Trigger Billing Event
        console.log("\n[2/4] Simulating Bill Creation for 5 units of TATA Salt...");
        const billRes = await fetch(`${baseUrl}/billing/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: "Test User",
                items: [{ product_id: 1, quantity: 5 }]
            })
        });
        const billData = await billRes.json();
        console.log("Response:", billData);

        // Wait for event processing
        await new Promise(r => setTimeout(r, 1000));

        // 3. Verify Stock Deduction
        console.log("\n[3/4] Verifying stock deduction...");
        const prodRes2 = await fetch(`${baseUrl}/inventory/products`);
        const products2 = await prodRes2.json();
        const salt2 = products2.find(p => p.id === 1);
        console.log(`New Stock: ${salt2.current_stock} (Expected: ${salt.current_stock - 5})`);

        // 4. Test Negative Stock Prevention
        console.log("\n[4/4] Testing Negative Stock Prevention (attempting to sold 200 units)...");
        const negBillRes = await fetch(`${baseUrl}/billing/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: "Over-buyer",
                items: [{ product_id: 1, quantity: 200 }]
            })
        });
        const negBillData = await negBillRes.json();
        console.log("Bill Status:", negBillData.message);

        console.log("\nNote: The inventory listener will log a failure for the 200 unit attempt due to the mock DB constraint.");

    } catch (err) {
        console.error("Verification Error:", err.message);
    }
}

testStockDeduction();
