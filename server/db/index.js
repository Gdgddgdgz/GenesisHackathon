// MOCK POSTGRESQL DATABASE
// Solves: ECONNREFUSED when local DB is missing.

const mockData = {
    users: [
        { id: 1, email: 'admin@sme.com', password: '$2a$10$YourHashedPasswordHere', name: 'Admin User' },
        { id: 2, email: 'user@sme.com', password: '$2a$10$YourHashedPasswordHere', name: 'Demo User' }
    ],
    products: [
        { id: 1, user_id: 1, name: 'Premium Cotton Shirt', sku: 'AP-001', category: 'apparel', unit_price: 1200, current_stock: 45, last_sold_date: '2026-02-01', price_volatility: 8, market_sentiment: 'Stable' },
        { id: 2, user_id: 1, name: 'Sports Running Shoes', sku: 'FW-010', category: 'footwear', unit_price: 2500, current_stock: 30, last_sold_date: '2026-01-15', price_volatility: 12, market_sentiment: 'Bullish' },
        { id: 4, user_id: 1, name: 'A4 Notebook (Set of 5)', sku: 'ST-005', category: 'stationery', unit_price: 250, current_stock: 120, last_sold_date: '2026-02-05', price_volatility: 15, market_sentiment: 'Bearish' },
        { id: 8, user_id: 2, name: 'Assorted Sweets Box', sku: 'SW-001', category: 'sweets_confectionery', unit_price: 600, current_stock: 55, last_sold_date: '2026-02-05', price_volatility: 25, market_sentiment: 'Bullish' }
    ],
    thresholds: [
        { product_id: 1, min_level: 50, max_level: 200 },
        { product_id: 4, min_level: 100, max_level: 500 }
    ],
    transactions: [],
    vendors: [
        { id: 1, user_id: 1, name: 'Sai Traders', phone: '+91 98765 43210', categories: ['Grocery', 'Grains'], trust_score: 92, last_delivery_time: new Date().toISOString() },
        { id: 2, user_id: 1, name: 'Metro Wholesalers', phone: '+91 91234 56789', categories: ['Spices', 'Snacks'], trust_score: 85, last_delivery_time: new Date().toISOString() },
        { id: 3, user_id: 2, name: 'Bombay Apparel Hub', phone: '+91 99999 88888', categories: ['apparel', 'footwear'], trust_score: 95, last_delivery_time: new Date().toISOString() }
    ]
};

console.log("⚠️ USING IN-MEMORY MOCK DATABASE (Postgres)");

const query = async (text, params = []) => {
    const sql = text.trim().toUpperCase();

    console.log(`[MockDB] SQL: "${sql}" | Params:`, params);

    // 1. Get All Products / Filtered by User
    if (sql.includes('SELECT * FROM PRODUCTS') || sql.includes('FROM PRODUCTS P LEFT JOIN THRESHOLDS T')) {
        let products = mockData.products;
        if (params.length > 0) {
            const userId = params[0];
            products = products.filter(p => p.user_id === userId);
        }

        // Enrich with thresholds
        const enriched = products.map(p => {
            const t = mockData.thresholds.find(th => th.product_id === p.id) || { min_level: 50, max_level: 200 };
            return {
                ...p,
                min_level: t.min_level,
                max_level: t.max_level
            };
        });
        return { rows: enriched };
    }

    // 2. Create Product (with user_id)
    if (sql.startsWith('INSERT INTO PRODUCTS')) {
        const newProduct = {
            id: mockData.products.length > 0 ? Math.max(...mockData.products.map(p => p.id)) + 1 : 1,
            user_id: params[5], // Assume 6th param is user_id
            name: params[0],
            sku: params[1],
            category: params[2],
            unit_price: params[3],
            current_stock: params[4] !== undefined ? parseInt(params[4]) : 0
        };
        mockData.products.push(newProduct);
        return { rows: [newProduct] };
    }

    // 3. Delete Product
    if (sql.startsWith('DELETE FROM PRODUCTS')) {
        const id = parseInt(params[0]);
        console.log(`[MockDB] Attempting to delete product with ID: ${id}`);
        const index = mockData.products.findIndex(p => p.id === id);
        if (index !== -1) {
            mockData.products.splice(index, 1);
            console.log(`[MockDB] Product ${id} deleted successfully.`);
            return { rowCount: 1, rows: [] };
        }
        console.warn(`[MockDB] Product ${id} not found.`);
        return { rowCount: 0, rows: [] };
    }

    // 4. Create Threshold
    if (sql.startsWith('INSERT INTO THRESHOLDS')) {
        mockData.thresholds.push({ product_id: params[0], min_level: 50, max_level: 200 });
        return { rows: [] };
    }

    // 5. Record Transaction
    if (sql.startsWith('INSERT INTO INVENTORY_TRANSACTIONS')) {
        const tx = {
            id: mockData.transactions.length + 1,
            product_id: params[0],
            type: params[1],
            quantity: params[2],
            reason: params[3]
        };
        mockData.transactions.push(tx);
        return { rows: [tx] };
    }

    // 6. Threshold Update
    if (sql.includes('UPDATE THRESHOLDS SET MIN_LEVEL')) {
        const newMin = params[0];
        const prodId = params[1];
        const t = mockData.thresholds.find(x => x.product_id === prodId);
        if (t) {
            t.min_level = newMin;
            return { rows: [t] };
        }
    }

    // 7. Update Stock
    if (sql.startsWith('UPDATE PRODUCTS')) {
        const prodId = parseInt(params[1]);
        const qty = parseInt(params[0]);
        const product = mockData.products.find(p => p.id === prodId);

        if (product) {
            let newStock = product.current_stock;
            if (sql.includes('CURRENT_STOCK +')) newStock += qty;
            if (sql.includes('CURRENT_STOCK -')) newStock -= qty;

            if (newStock < 0) {
                throw new Error(`Negative stock constraint violated for product ${product.name}`);
            }

            product.current_stock = newStock;
            return { rows: [product], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 12. Update Trust Score (Simulation)
    if (sql.startsWith('UPDATE VENDORS SET TRUST_SCORE')) {
        const id = parseInt(params[1]);
        const delta = parseInt(params[0]);
        console.log(`[MockDB] Simulating Trust Score adjustment for Vendor ${id} | Delta: ${delta}`);
        const vendor = mockData.vendors.find(v => v.id === id);
        if (vendor) {
            // Support relative adjustment (Delta)
            if (sql.includes('TRUST_SCORE +') || sql.includes('TRUST_SCORE -')) {
                vendor.trust_score = Math.min(100, Math.max(0, vendor.trust_score + delta));
            } else {
                // Direct set (if logic changes)
                vendor.trust_score = Math.min(100, Math.max(0, delta));
            }
            console.log(`[MockDB] Vendor ${id} New Trust Score: ${vendor.trust_score}`);
            return { rowCount: 1, rows: [vendor] };
        }
        return { rowCount: 0, rows: [] };
    }

    // 8. Get Vendors by User
    if (sql.includes('SELECT * FROM VENDORS')) {
        if (params.length > 0) {
            const userId = params[0];
            return { rows: mockData.vendors.filter(v => v.user_id === userId) };
        }
        return { rows: mockData.vendors };
    }

    // 9. Create Vendor
    if (sql.startsWith('INSERT INTO VENDORS')) {
        const newVendor = {
            id: mockData.vendors.length > 0 ? Math.max(...mockData.vendors.map(v => v.id)) + 1 : 1,
            user_id: params[3], // 4th param is user_id
            name: params[0],
            phone: params[1],
            categories: params[2],
            trust_score: 80,
            last_delivery_time: new Date().toISOString()
        };
        mockData.vendors.push(newVendor);
        return { rows: [newVendor] };
    }

    // 10. Delete Vendor
    if (sql.startsWith('DELETE FROM VENDORS')) {
        const id = parseInt(params[0]);
        console.log(`[MockDB] Attempting to delete vendor with ID: ${id}`);
        const index = mockData.vendors.findIndex(v => v.id === id);
        if (index !== -1) {
            mockData.vendors.splice(index, 1);
            console.log(`[MockDB] Vendor ${id} deleted successfully.`);
            return { rowCount: 1, rows: [] };
        }
        console.warn(`[MockDB] Vendor ${id} not found.`);
        return { rowCount: 0, rows: [] };
    }

    // 11. Individual Product Check
    if (sql.startsWith('SELECT MIN_LEVEL')) {
        const prodId = params[0];
        const t = mockData.thresholds.find(x => x.product_id === prodId);
        return { rows: t ? [t] : [{ min_level: 10, max_level: 100 }] };
    }

    // 12. Get Users (Mock)
    if (sql.includes('SELECT * FROM USERS')) {
        return { rows: mockData.users };
    }

    // 13. Create User (Mock)
    if (sql.startsWith('INSERT INTO USERS')) {
        const newUser = {
            id: mockData.users.length > 0 ? Math.max(...mockData.users.map(u => u.id)) + 1 : 1,
            name: params[0],
            email: params[1],
            password: params[2]
        };
        mockData.users.push(newUser);
        return { rows: [newUser] };
    }

    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) {
        return { rows: [] };
    }

    console.log(`[MockDB] Unhandled Query: ${text}`);
    return { rows: [] };
};

module.exports = {
    query,
    pool: { on: () => { } } // Mock pool events
};
