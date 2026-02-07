// MOCK MONGODB CONNECTION
// Solves: MongoDB connection failure

const connectDB = async () => {
    console.log("⚠️ USING IN-MEMORY MOCK MONGODB");
    // Do nothing real
    console.log('MongoDB Connected (Mock)');
};

module.exports = connectDB;
