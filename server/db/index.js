// MOCK POSTGRESQL DATABASE
// Solves: ECONNREFUSED when local DB is missing.

const mockData = {
    products: [
        { id: 1, name: 'Premium Cotton Shirt', sku: 'AP-001', category: 'apparel', unit_price: 1200, current_stock: 45, last_sold_date: '2026-02-01', price_volatility: 8, market_sentiment: 'Stable' },
        { id: 2, name: 'Sports Running Shoes', sku: 'FW-010', category: 'footwear', unit_price: 2500, current_stock: 30, last_sold_date: '2026-01-15', price_volatility: 12, market_sentiment: 'Bullish' },
        { id: 3, name: 'Leather Wallet', sku: 'FA-022', category: 'fashion_accessories', unit_price: 800, current_stock: 15, last_sold_date: '2025-10-10', price_volatility: 5, market_sentiment: 'Stable' }, // DEAD STOCK
        { id: 4, name: 'A4 Notebook (Set of 5)', sku: 'ST-005', category: 'stationery', unit_price: 250, current_stock: 120, last_sold_date: '2026-02-05', price_volatility: 15, market_sentiment: 'Bearish' },
        { id: 5, name: 'Best Seller Novel', sku: 'BK-101', category: 'books_magazines', unit_price: 450, current_stock: 12, last_sold_date: '2025-09-01', price_volatility: 3, market_sentiment: 'Stable' }, // DEAD STOCK
        { id: 6, name: 'Action Figure Toy', sku: 'TY-009', category: 'toys_games', unit_price: 999, current_stock: 8, last_sold_date: '2026-02-02', price_volatility: 20, market_sentiment: 'Bullish' },
        { id: 7, name: 'Handcrafted Vase', sku: 'GH-033', category: 'gifts_handicrafts', unit_price: 1500, current_stock: 5, last_sold_date: '2025-08-20', price_volatility: 10, market_sentiment: 'Stable' }, // DEAD STOCK
        { id: 8, name: 'Assorted Sweets Box', sku: 'SW-001', category: 'sweets_confectionery', unit_price: 600, current_stock: 55, last_sold_date: '2026-02-05', price_volatility: 25, market_sentiment: 'Bullish' },
        { id: 31, name: 'Ganesh Idol (Eco-friendly)', sku: 'PS-108', category: 'flower_shops_pu_supplies', unit_price: 2500, current_stock: 4, last_sold_date: '2026-02-06', price_volatility: 30, market_sentiment: 'Bullish' }, // LOW STOCK (Context)
        { id: 32, name: 'Mumbai Diaries 2026', sku: 'ST-999', category: 'stationery', unit_price: 350, current_stock: 200, last_sold_date: '2025-07-01', price_volatility: 2, market_sentiment: 'Bearish' }, // DEAD STOCK
        { id: 33, name: 'Vidyavihar Exam Guides', sku: 'BK-500', category: 'books_magazines', unit_price: 200, current_stock: 15, last_sold_date: '2026-02-04', price_volatility: 5, market_sentiment: 'Stable' }, // LOW STOCK
        { id: 9, name: 'Whole Wheat Bread', sku: 'BP-012', category: 'bakery_products', unit_price: 45, current_stock: 20, last_sold_date: '2026-02-06', price_volatility: 10, market_sentiment: 'Stable' },
        { id: 10, name: 'Fresh Milk (1L)', sku: 'DP-001', category: 'dairy_products', unit_price: 65, current_stock: 40, last_sold_date: '2026-02-06', price_volatility: 15, market_sentiment: 'Stable' },
        { id: 11, name: 'Organic Bananas (1kg)', sku: 'FV-005', category: 'fruits_vegetables', unit_price: 80, current_stock: 25, last_sold_date: '2026-02-06', price_volatility: 20, market_sentiment: 'Bullish' },
        { id: 12, name: 'Potato Chips (Large)', sku: 'PF-020', category: 'packaged_food_snacks', unit_price: 50, current_stock: 90, last_sold_date: '2026-02-04', price_volatility: 5, market_sentiment: 'Stable' },
        { id: 13, name: 'Masala Chai Leaves', sku: 'BV-008', category: 'beverages_tea_coffee_soft_drinks', unit_price: 120, current_stock: 60, last_sold_date: '2026-02-05', price_volatility: 8, market_sentiment: 'Stable' },
        { id: 14, name: 'Turmeric Powder (200g)', sku: 'SM-001', category: 'spices_masalas', unit_price: 55, current_stock: 110, last_sold_date: '2026-02-01', price_volatility: 12, market_sentiment: 'Bullish' },
        { id: 15, name: 'Basmati Rice (5kg)', sku: 'GK-001', category: 'grocery_kirana', unit_price: 750, current_stock: 15, last_sold_date: '2026-02-02', price_volatility: 10, market_sentiment: 'Stable' },
        { id: 16, name: 'Floor Cleaner (1L)', sku: 'HC-005', category: 'household_cleaning_supplies', unit_price: 180, current_stock: 35, last_sold_date: '2026-01-20', price_volatility: 5, market_sentiment: 'Stable' },
        { id: 17, name: 'Premium Paan Masala', sku: 'TP-010', category: 'tobacco_products_paan', unit_price: 20, current_stock: 200, last_sold_date: '2026-02-06', price_volatility: 2, market_sentiment: 'Stable' },
        { id: 18, name: 'Paracetamol (Tablets)', sku: 'MD-001', category: 'medicines_otc', unit_price: 30, current_stock: 300, last_sold_date: '2026-02-05', price_volatility: 0, market_sentiment: 'Stable' },
        { id: 19, name: 'USB-C Charging Cable', sku: 'MA-005', category: 'mobile_accessories', unit_price: 350, current_stock: 80, last_sold_date: '2026-02-03', price_volatility: 15, market_sentiment: 'Bearish' },
        { id: 20, name: 'LED Bulb (9W)', sku: 'EG-012', category: 'electrical_goods', unit_price: 120, current_stock: 50, last_sold_date: '2026-01-30', price_volatility: 10, market_sentiment: 'Stable' },
        { id: 21, name: 'Detergent Powder (1kg)', sku: 'LS-001', category: 'laundry_services', unit_price: 150, current_stock: 45, last_sold_date: '2026-02-02', price_volatility: 5, market_sentiment: 'Stable' },
        { id: 22, name: 'Sewing Thread Set', sku: 'TS-005', category: 'tailoring_specialists', unit_price: 100, current_stock: 150, last_sold_date: '2026-02-01', price_volatility: 3, market_sentiment: 'Stable' },
        { id: 23, name: 'Shaving Cream', sku: 'GS-010', category: 'grooming_salon_essentials', unit_price: 220, current_stock: 25, last_sold_date: '2026-01-25', price_volatility: 8, market_sentiment: 'Stable' },
        { id: 24, name: 'Door Hinges (Pair)', sku: 'HP-005', category: 'hardware_paints', unit_price: 450, current_stock: 12, last_sold_date: '2025-11-20', price_volatility: 12, market_sentiment: 'Stable' }, // DEAD STOCK
        { id: 25, name: 'Engine Oil (1L)', sku: 'AS-012', category: 'auto_spare_parts_lubricants', unit_price: 550, current_stock: 18, last_sold_date: '2026-02-02', price_volatility: 10, market_sentiment: 'Stable' },
        { id: 26, name: 'Incense Sticks (Agarbatti)', sku: 'FS-001', category: 'flower_shops_pu_supplies', unit_price: 40, current_stock: 500, last_sold_date: '2026-02-06', price_volatility: 5, market_sentiment: 'Stable' },
        { id: 27, name: 'Frozen Chicken (1kg)', sku: 'PM-005', category: 'poultry_meat_fish_shops', unit_price: 280, current_stock: 10, last_sold_date: '2026-02-05', price_volatility: 15, market_sentiment: 'Stable' },
        { id: 28, name: 'TATA Salt', sku: 'TS-001', category: 'grocery_kirana', unit_price: 25, current_stock: 100, last_sold_date: '2026-02-06', price_volatility: 0, market_sentiment: 'Stable' },
        { id: 29, name: 'Maggi Noodles', sku: 'MN-012', category: 'packaged_food_snacks', unit_price: 14, current_stock: 10, last_sold_date: '2026-02-06', price_volatility: 5, market_sentiment: 'Stable' },
        { id: 30, name: 'Coke (500ml)', sku: 'BV-002', category: 'beverages_tea_coffee_soft_drinks', unit_price: 40, current_stock: 100, last_sold_date: '2026-02-06', price_volatility: 3, market_sentiment: 'Stable' },
    ],
    thresholds: [
        { product_id: 1, min_level: 50, max_level: 200 },
        { product_id: 4, min_level: 100, max_level: 500 },
        { id: 3, product_id: 29, min_level: 50, max_level: 100 },
    ],
    transactions: [],
    vendors: [
        { id: 1, name: 'Sai Traders', phone: '+91 98765 43210', categories: ['Grocery', 'Grains'], trust_score: 92, last_delivery_time: new Date().toISOString() },
        { id: 2, name: 'Metro Wholesalers', phone: '+91 91234 56789', categories: ['Spices', 'Snacks'], trust_score: 85, last_delivery_time: new Date().toISOString() },
        { id: 3, name: 'Bombay Apparel Hub', phone: '+91 99999 88888', categories: ['apparel', 'footwear'], trust_score: 95, last_delivery_time: new Date().toISOString() },
    ]
};

console.log("⚠️ USING IN-MEMORY MOCK DATABASE (Postgres)");

const query = async (text, params = []) => {
    const sql = text.trim().toUpperCase();

    console.log(`[MockDB] SQL: "${sql}" | Params:`, params);

    // 1. Get All Products / Filtered
    if (sql.includes('SELECT * FROM PRODUCTS') || sql.includes('FROM PRODUCTS P LEFT JOIN THRESHOLDS T')) {
        // Return products enriched with threshold data
        return {
            rows: mockData.products.map(p => ({
                ...p,
                min_level: mockData.thresholds.find(t => t.product_id === p.id)?.min_level
            }))
        };
    }

    // 2. Create Product
    if (sql.startsWith('INSERT INTO PRODUCTS')) {
        const newProduct = {
            id: mockData.products.length > 0 ? Math.max(...mockData.products.map(p => p.id)) + 1 : 1,
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
        console.log(`[MockDB] Simulating Trust Score update for Vendor ${id} | Delta: ${delta}`);
        const vendor = mockData.vendors.find(v => v.id === id);
        if (vendor) {
            vendor.trust_score = Math.min(100, Math.max(0, vendor.trust_score + delta));
            console.log(`[MockDB] Vendor ${id} New Trust Score: ${vendor.trust_score}`);
            return { rowCount: 1, rows: [vendor] };
        }
        return { rowCount: 0, rows: [] };
    }

    // 8. Get Vendors
    if (sql.includes('SELECT * FROM VENDORS')) {
        return { rows: mockData.vendors };
    }

    // 9. Create Vendor
    if (sql.startsWith('INSERT INTO VENDORS')) {
        const newVendor = {
            id: mockData.vendors.length > 0 ? Math.max(...mockData.vendors.map(v => v.id)) + 1 : 1,
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
