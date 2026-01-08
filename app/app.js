const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session'); 
const app = express();
const routes = require('./routes/index');

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- PERUBAHAN DI SINI (Menggunakan .env) ---
app.use(session({
    // Mengambil secret dari file .env (lewat docker-compose)
    // Jika gagal ambil, pakai 'rahasia_default' sebagai cadangan
    secret: process.env.SESSION_SECRET || 'rahasia_kelompok_e6', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Sesi berlaku 1 jam
}));

// Routes
app.use('/', routes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});