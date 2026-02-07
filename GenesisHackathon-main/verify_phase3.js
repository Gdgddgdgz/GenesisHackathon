async function testPhase3() {
    console.log("--- Phase 3 Adaptive Micro-Zone Verification ---");

    try {
        // 1. Check Heatmap for spikes
        console.log("\n[1/3] Fetching Adaptive Heatmap...");
        const res = await fetch('http://localhost:8000/heatmap');
        const data = await res.json();

        console.log(`Detected ${data.features.length} significant zones.`);

        data.features.forEach(f => {
            console.log(`- Zone: ${f.properties.name}`);
            console.log(`  Spike: ${f.properties.spike} | Dist: ${f.properties.distance.toFixed(1)}km`);
            console.log(`  Label: ${f.properties.label}`);
            console.log(`  Type: ${f.geometry.type}`);
        });

        // 2. Verify distance filtering
        const farZones = data.features.filter(f => f.properties.distance > 10);
        console.log(`\n[2/3] Distance Check:`);
        if (farZones.length > 0) {
            farZones.forEach(fz => {
                const spike = parseInt(fz.properties.spike);
                if (spike >= 40) {
                    console.log(`✅ Exception Allowed: ${fz.properties.name} (${spike}% surge at ${fz.properties.distance.toFixed(1)}km)`);
                } else {
                    console.log(`❌ FAIL: Noise zone ${fz.properties.name} at ${fz.properties.distance.toFixed(1)}km should be ignored.`);
                }
            });
        } else {
            console.log("✅ No far zones detected (consistent with logic if no 40%+ surges present).");
        }

        // 3. Verify Cause Inference
        console.log("\n[3/3] Inference Check:");
        const holiSpike = data.features.find(f => f.properties.reason === "Holi");
        if (holiSpike) console.log(`✅ Holi Inference: detected in ${holiSpike.properties.name}`);

        const examSpike = data.features.find(f => f.properties.reason === "Exams");
        if (examSpike) console.log(`✅ Exam Inference: detected in ${examSpike.properties.name}`);

    } catch (err) {
        console.error("Verification Error:", err.message);
    }
}

testPhase3();
