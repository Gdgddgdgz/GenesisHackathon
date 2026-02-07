async function testPhase2() {
    console.log("--- Phase 2 AI Verification ---");

    try {
        // 1. Check Prophet Forecast for Kurla (Muslim Majority)
        console.log("\n[1/3] Testing Prophet Forecast (Kurla - Muslim Majority)...");
        const resKurla = await fetch('http://localhost:8000/forecast/1?region=Kurla');
        const dataKurla = await resKurla.json();
        console.log(`Region: ${dataKurla.region}`);
        console.log(`Action: Reorder ${dataKurla.inventory_actions.reorder_quantity}, Safety: ${dataKurla.inventory_actions.safety_stock}`);
        console.log(`Reasoning: ${dataKurla.inventory_actions.reasoning}`);

        // 2. Check Prophet Forecast for Andheri (Academic)
        console.log("\n[2/3] Testing Prophet Forecast (Andheri - Academic)...");
        const resAndheri = await fetch('http://localhost:8000/forecast/1?region=Andheri');
        const dataAndheri = await resAndheri.json();
        console.log(`Region: ${dataAndheri.region}`);
        console.log(`Action: Reorder ${dataAndheri.inventory_actions.reorder_quantity}, Safety: ${dataAndheri.inventory_actions.safety_stock}`);

        // Compare (Kurla should generally have higher demand if simulated correctly)
        if (dataKurla.inventory_actions.reorder_quantity > 0) console.log("✅ Prophet Forecast: PASS");

        // 3. Check Heatmap Filtering
        console.log("\n[3/3] Testing Heatmap Filtering...");
        const resHeatmap = await fetch('http://localhost:8000/heatmap?region=Bandra');
        const heatmap = await resHeatmap.json();
        const bandraPoints = heatmap.features.filter(f => f.properties.region === "Bandra");
        console.log(`Found ${bandraPoints.length} points for Bandra`);
        if (bandraPoints.length > 0 && heatmap.features.every(f => f.properties.region === "Bandra")) {
            console.log("✅ Heatmap Filtering: PASS");
        }

    } catch (err) {
        console.error("Verification Error:", err.message);
    }
}

testPhase2();
