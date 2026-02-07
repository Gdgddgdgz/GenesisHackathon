// MOCK REDIS CLIENT
// Solves: Redis connection errors

console.log("⚠️ USING IN-MEMORY MOCK REDIS");

const mockClient = {
    connect: async () => console.log("[MockRedis] Connected"),
    on: (event, cb) => { if (event === 'error') { /* ignore */ } },
    publish: async (channel, message) => console.log(`[MockRedis Pub] ${channel}: ${message}`),
    setEx: async (key, ttl, val) => console.log(`[MockRedis Set] ${key} (ttl ${ttl}): ${val}`),
    get: async (key) => null
};

module.exports = mockClient;
