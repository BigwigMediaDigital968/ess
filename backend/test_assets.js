const jwt = require('jsonwebtoken');

require('dotenv').config({ path: '/app/.env' });

const token = jwt.sign({ id: '2f08b65f-103d-42c9-a8a2-df9aa53f38bf' }, process.env.JWT_SECRET || 'changeme_in_production', { expiresIn: '1h' });

async function run() {
    try {
        const res = await fetch('http://localhost:3434/api/assets', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("RESPONSE from /api/assets:", data.length, "assets");
    } catch (e) {
        console.error(e.message);
    }
}
run();
