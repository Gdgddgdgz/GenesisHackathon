const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyAuth() {
    console.log('--- STARTING AUTH VERIFICATION ---');

    try {
        // 1. Signup User A
        console.log('\n[1] Registering User A...');
        const signupARes = await axios.post(`${API_URL}/auth/signup`, {
            name: 'User A',
            email: `user-a-${Date.now()}@test.com`,
            password: 'password123'
        });
        const userA = signupARes.data;
        console.log('User A registered successfully:', userA.email);

        // 2. Signup User B
        console.log('\n[2] Registering User B...');
        const signupBRes = await axios.post(`${API_URL}/auth/signup`, {
            name: 'User B',
            email: `user-b-${Date.now()}@test.com`,
            password: 'password123'
        });
        const userB = signupBRes.data;
        console.log('User B registered successfully:', userB.email);

        // 3. User A creates a product
        console.log('\n[3] User A creating a product...');
        const prodARes = await axios.post(`${API_URL}/inventory/products`, {
            name: 'User A Product',
            sku: 'UA-01',
            category: 'test',
            unit_price: 100,
            current_stock: 10
        }, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        console.log('User A product created:', prodARes.data.name);

        // 4. User B fetches products (should be empty, or not see User A's product)
        console.log('\n[4] User B fetching products...');
        const prodsBRes = await axios.get(`${API_URL}/inventory/products`, {
            headers: { Authorization: `Bearer ${userB.token}` }
        });
        const userBProducts = prodsBRes.data;
        const foundAInB = userBProducts.some(p => p.name === 'User A Product');

        console.log('User B product count:', userBProducts.length);
        if (foundAInB) {
            console.error('❌ FAILURE: User B can see User A\'s product!');
        } else {
            console.log('✅ SUCCESS: User B cannot see User A\'s data.');
        }

        // 5. User A fetches products (should see their own product)
        console.log('\n[5] User A fetching products...');
        const prodsARes = await axios.get(`${API_URL}/inventory/products`, {
            headers: { Authorization: `Bearer ${userA.token}` }
        });
        const foundAInA = prodsARes.data.some(p => p.name === 'User A Product');
        if (foundAInA) {
            console.log('✅ SUCCESS: User A can see their own data.');
        } else {
            console.error('❌ FAILURE: User A cannot see their own product!');
        }

    } catch (err) {
        console.error('❌ VERIFICATION ERROR:', err.response?.data || err.message);
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

verifyAuth();
