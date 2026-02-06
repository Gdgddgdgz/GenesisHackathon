const testAI = async () => {
    const url = 'http://localhost:8000/forecast/festival';
    try {
        console.log("Testing AI Service at " + url);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Success! Response:", data);
    } catch (err) {
        console.error("❌ Failed!", err.message);
        if (err.cause) console.error("Cause:", err.cause);
    }
};

testAI();
