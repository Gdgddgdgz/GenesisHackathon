async function verifySegmentLogic() {
    console.log("--- Business-Specific Segment Logic Verification ---");

    try {
        // 1. Check Stationery
        console.log("\n[TEST 1] Stationery Segment (Exam Season)...");
        const resStat = await fetch('http://localhost:8000/heatmap?segment=stationery');
        const dataStat = await resStat.json();

        dataStat.features.forEach(f => {
            console.log(`- ${f.properties.name}: ${f.properties.spike} surge | Intensity: ${f.properties.intensity.toFixed(2)}`);
            console.log(`  Reason: ${f.properties.reason}`);
        });

        // 2. Check Apparel
        console.log("\n[TEST 2] Apparel Segment (Festival Season)...");
        const resApp = await fetch('http://localhost:8000/heatmap?segment=apparel');
        const dataApp = await resApp.json();

        dataApp.features.forEach(f => {
            console.log(`- ${f.properties.name}: ${f.properties.spike} surge | Intensity: ${f.properties.intensity.toFixed(2)}`);
            console.log(`  Reason: ${f.properties.reason}`);
        });

    } catch (err) {
        console.error("Verification Error:", err.message);
    }
}

verifySegmentLogic();
