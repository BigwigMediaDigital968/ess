const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '/app/.env' });
const token = jwt.sign({ id: '2f08b65f-103d-42c9-a8a2-df9aa53f38bf' }, process.env.JWT_SECRET || 'changeme_in_production', { expiresIn: '1h' });

async function run() {
    try {
        const res = await fetch('http://localhost:3434/api/employees', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("RESPONSE from /api/employees:", typeof data === 'object' && Array.isArray(data) ? data.length : data);
    } catch(e) {
        console.error("ERROR:", e.message);
    }
}
run();
