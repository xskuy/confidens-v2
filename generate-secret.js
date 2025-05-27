// Script temporal para generar AUTH_SECRET
const crypto = require('node:crypto');

const secret = crypto.randomBytes(32).toString('base64');
console.log('Tu AUTH_SECRET es:');
console.log(secret);
console.log('\nCopia esta línea completa en tu .env.local:');
console.log(`AUTH_SECRET="${secret}"`);
