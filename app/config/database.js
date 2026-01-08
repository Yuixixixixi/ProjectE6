const mysql = require('mysql2');

const pool = mysql.createPool({
    // Gunakan process.env untuk mengambil data
    host: process.env.DB_HOST || 'db', 
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123', // Fallback jika .env gagal
    database: process.env.DB_NAME || 'perpustakaan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();