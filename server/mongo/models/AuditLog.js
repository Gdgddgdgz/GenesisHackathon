// MOCK MONGOOSE MODEL
// Solves: Missing MongoDB dependencies/connection

const mockLogs = [];

class MockAuditLog {
    static async create(data) {
        console.log(`[MockAuditLog] Recorded: ${data.action} on ${data.entity}`);
        const log = { ...data, _id: Date.now(), timestamp: new Date() };
        mockLogs.unshift(log); // Add to beginning
        return log;
    }

    static async find() {
        return {
            sort: () => mockLogs // Mock chainable sort
        };
    }
}

module.exports = MockAuditLog;
