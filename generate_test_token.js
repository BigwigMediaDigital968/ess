const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

const token = jwt.sign({ id: '2f08b65f-103d-42c9-a8a2-df9aa53f38bf' }, process.env.JWT_SECRET || 'fallback', { expiresIn: '1h' });
console.log(token);
