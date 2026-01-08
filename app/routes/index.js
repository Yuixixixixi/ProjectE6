const express = require('express');
const router = express.Router();
const db = require('../config/database');

// --- MIDDLEWARE (SATPAM) ---
// Fungsi ini akan mengecek: Apakah user sudah login?
// Jika belum, tendang ke halaman login.
const requireLogin = (req, res, next) => {
    if (req.session && req.session.adminId) {
        next(); // Boleh lewat
    } else {
        res.redirect('/login'); // Ditolak, suruh login dulu
    }
};

// --- RUTE LOGIN & LOGOUT (Bebas Akses) ---

// 1. Tampilkan Halaman Login
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// 2. Proses Cek Password
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Cari admin berdasarkan email
        const [users] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
        
        // Cek apakah user ketemu DAN password cocok
        if (users.length > 0 && users[0].password == password) {
            // BERHASIL: Simpan data di session
            req.session.adminId = users[0].id_admin;
            req.session.adminNama = users[0].nama;
            res.redirect('/'); // Masuk ke dashboard
        } else {
            // GAGAL
            res.render('login', { error: 'Email atau Password salah!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Database Error');
    }
});

// 3. Logout
router.get('/logout', (req, res) => {
    req.session.destroy(); // Hapus sesi
    res.redirect('/login');
});

// ====================================================
// SEMUA RUTE DI BAWAH INI DILINDUNGI OLEH SATPAM (requireLogin)
// ====================================================
router.use(requireLogin); 

// (R) READ: Halaman Utama (Buku)
router.get('/', async (req, res) => {
    try {
        const [books] = await db.query('SELECT * FROM buku ORDER BY id_buku DESC');
        // Kita kirim variabel 'user' agar bisa menampilkan nama admin di navbar
        res.render('index', { books, user: req.session.adminNama });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database Error');
    }
});

// ... (Sisa kode CRUD Buku, Peminjam, Transaksi sama seperti sebelumnya) ...
// ... Pastikan kamu copy-paste kode CRUD (create, update, delete) 
// ... yang sudah kita buat sebelumnya DI BAWAH baris router.use(requireLogin) ini.
// ... Agar tidak kepanjangan, saya tulis ringkasannya di bawah:

// (C) Create Buku
router.post('/add-book', async (req, res) => {
    /* ... Kode insert buku ... */
    const { judul_buku, stok } = req.body;
    await db.query('INSERT INTO buku (judul_buku, stok) VALUES (?, ?)', [judul_buku, stok]);
    res.redirect('/');
});

// (D) DELETE: Hapus Buku
router.post('/delete-book/:id', async (req, res) => {
    const id = req.params.id;
    try {
        // --- PERBAIKAN DI SINI ---
        
        // Langkah 1: Hapus dulu semua riwayat transaksi yang menggunakan buku ini
        // (Agar tidak kena Foreign Key Error)
        await db.query('DELETE FROM peminjaman WHERE id_buku = ?', [id]);

        // Langkah 2: Setelah bersih, baru hapus bukunya
        await db.query('DELETE FROM buku WHERE id_buku = ?', [id]);
        
        res.redirect('/');
    } catch (err) {
        console.error(err);
        // Tampilkan pesan error di browser jika masih gagal (opsional)
        res.status(500).send(`
            <h3>Gagal menghapus buku!</h3>
            <p>Error: ${err.message}</p>
            <a href="/">Kembali</a>
        `);
    }
});

// (U) Edit Book Page & Process
router.get('/edit-book/:id', async (req, res) => {
    /* ... Kode edit buku ... */
    const [result] = await db.query('SELECT * FROM buku WHERE id_buku = ?', [req.params.id]);
    res.render('edit', { book: result[0] });
});
router.post('/update-book/:id', async (req, res) => {
    /* ... Kode update buku ... */
    const { judul_buku, stok } = req.body;
    await db.query('UPDATE buku SET judul_buku = ?, stok = ? WHERE id_buku = ?', [judul_buku, stok, req.params.id]);
    res.redirect('/');
});

// --- RUTE PEMINJAM ---
router.get('/peminjam', async (req, res) => {
    /* ... Kode list peminjam ... */
    const [rows] = await db.query('SELECT * FROM peminjam ORDER BY id_peminjam DESC');
    res.render('peminjam', { peminjam: rows });
});
router.post('/add-peminjam', async (req, res) => {
    /* ... Kode add peminjam ... */
    const { nama, nomor_telepon } = req.body;
    await db.query('INSERT INTO peminjam (nama, nomor_telepon) VALUES (?, ?)', [nama, nomor_telepon]);
    res.redirect('/peminjam');
});
// (D) DELETE: Hapus Peminjam
router.post('/delete-peminjam/:id', async (req, res) => {
    const id = req.params.id;
    try {
        // Langkah 1: Hapus riwayat transaksi orang ini dulu
        await db.query('DELETE FROM peminjaman WHERE id_peminjam = ?', [id]);

        // Langkah 2: Baru hapus orangnya
        await db.query('DELETE FROM peminjaman WHERE id_peminjam = ?', [id]); // Note: query table 'peminjam' di baris ini
        // Koreksi baris di atas, harusnya delete dari tabel 'peminjam' (data master user)
        await db.query('DELETE FROM peminjam WHERE id_peminjam = ?', [id]); 

        res.redirect('/peminjam');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error hapus peminjam');
    }
});

// (U) UPDATE - Part 1: Tampilkan Halaman Edit Peminjam
router.get('/edit-peminjam/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await db.query('SELECT * FROM peminjam WHERE id_peminjam = ?', [id]);
        
        // Cek jika data tidak ditemukan
        if (rows.length === 0) return res.redirect('/peminjam');
        
        // Render halaman edit khusus peminjam
        res.render('edit-peminjam', { peminjam: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error mengambil data peminjam');
    }
});

// (U) UPDATE - Part 2: Proses Simpan Perubahan Peminjam
router.post('/update-peminjam/:id', async (req, res) => {
    const id = req.params.id;
    const { nama, nomor_telepon } = req.body;
    try {
        await db.query('UPDATE peminjam SET nama = ?, nomor_telepon = ? WHERE id_peminjam = ?', [nama, nomor_telepon, id]);
        res.redirect('/peminjam');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error update peminjam');
    }
});

// --- RUTE TRANSAKSI ---
router.get('/transaksi', async (req, res) => {
    /* ... Kode list transaksi ... */
    const [books] = await db.query('SELECT * FROM buku WHERE stok > 0');
    const [peminjam] = await db.query('SELECT * FROM peminjam');
    const query = `
            SELECT t.*, b.judul_buku, p.nama AS nama_peminjam 
            FROM peminjaman t
            JOIN buku b ON t.id_buku = b.id_buku
            JOIN peminjam p ON t.id_peminjam = p.id_peminjam
            ORDER BY t.tanggal_pinjam DESC
        `;
    const [transaksi] = await db.query(query);
    res.render('transaksi', { books, peminjam, transaksi });
});

router.post('/pinjam-buku', async (req, res) => {
    /* ... Kode pinjam ... */
    const { id_peminjam, id_buku } = req.body;
    await db.query('INSERT INTO peminjaman (id_peminjam, id_buku, status_peminjaman, tanggal_pinjam) VALUES (?, ?, "dipinjam", NOW())', [id_peminjam, id_buku]);
    await db.query('UPDATE buku SET stok = stok - 1 WHERE id_buku = ?', [id_buku]);
    res.redirect('/transaksi');
});

router.post('/kembalikan-buku/:id', async (req, res) => {
    /* ... Kode kembali ... */
    const id_transaksi = req.params.id;
    const { id_buku } = req.body;
    await db.query('UPDATE peminjaman SET status_peminjaman = "kembali", tanggal_pengembalian = NOW() WHERE id_peminjaman = ?', [id_transaksi]);
    await db.query('UPDATE buku SET stok = stok + 1 WHERE id_buku = ?', [id_buku]);
    res.redirect('/transaksi');
});

module.exports = router;