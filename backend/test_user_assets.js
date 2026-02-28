const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '/app/.env' });
const token = jwt.sign({ id: '7372b385-be6b-4767-b818-657b6b74ccb2' }, process.env.JWT_SECRET || 'changeme_in_production', { expiresIn: '1h' });

async function run() {
    try {
        const res = await fetch('http://localhost:3434/api/assets', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("RESPONSE from /api/assets for Suramya:", data.length);
    } catch(e) {
        console.error("ERROR:", e.message);
    }
}
run();
