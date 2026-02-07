async function test() {
    console.log("--- Starting Verification ---");

    try {
        // 1. Check AI Heatmap
        console.log("\n[1/3] Testing AI Heatmap...");
        const hRes = await fetch('http://localhost:8000/heatmap');
        const heatmap = await hRes.json();
        const point = heatmap.features[0].geometry.coordinates;
        console.log(`Heatmap Point: ${point}`);
        const latDiff = Math.abs(point[1] - 19.0760);
        const lonDiff = Math.abs(point[0] - 72.8777);
        console.log(`Lat Diff: ${latDiff.toFixed(4)}, Lon Diff: ${lonDiff.toFixed(4)}`);
        if (latDiff < 0.03 && lonDiff < 0.03) console.log("✅ Heatmap Radius: PASS");

        // 2. Check Add Product
        console.log("\n[2/3] Testing Add Product...");
        const newProduct = {
            name: "Parle-G",
            sku: `PG-${Date.now()}`,
            category: "Snacks",
            unit_price: 5,
            current_stock: 200
        };
        const addRes = await fetch('http://localhost:5000/api/inventory/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        const addData = await addRes.json();
        console.log(`Result: ${addData.name} added with ID ${addData.id}`);
        if (addData.name === "Parle-G") console.log("✅ Add Product: PASS");

        // 3. Check Restock & Gemini Logic
        console.log("\n[3/3] Testing Restock & Gemini Integration...");
        const tx = {
            product_id: 2,
            type: "OUT",
            quantity: 5,
            reason: "Verification Test"
        };
        const txRes = await fetch('http://localhost:5000/api/inventory/transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tx)
        });
        const txData = await txRes.json();
        console.log(`Restock Triggered. New Stock: ${txData.new_stock}`);
        if (txData.success) console.log("✅ Transaction: PASS");
        console.log("Check backend console for Gemini message log.");

    } catch (err) {
        console.error("Verification Error:", err.message);
    }
}

test();
