CREATE DATABASE IF NOT EXISTS perpustakaan;
USE perpustakaan;

-- Tabel 1: Buku [cite: 21]
CREATE TABLE IF NOT EXISTS buku (
    id_buku INT AUTO_INCREMENT PRIMARY KEY,
    judul_buku VARCHAR(255) NOT NULL,
    stok INT DEFAULT 0
);

-- Tabel 2: Peminjam [cite: 25]
CREATE TABLE IF NOT EXISTS peminjam (
    id_peminjam INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nomor_telepon VARCHAR(20)
);

-- Tabel 3: Admin [cite: 27]
CREATE TABLE IF NOT EXISTS admin (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255)
);

-- Tabel 4: Peminjaman Buku (Relasi Many to Many) [cite: 29, 33]
CREATE TABLE IF NOT EXISTS peminjaman (
    id_peminjaman INT AUTO_INCREMENT PRIMARY KEY,
    id_peminjam INT,
    id_buku INT,
    status_peminjaman ENUM('dipinjam', 'kembali') DEFAULT 'dipinjam',
    tanggal_pinjam DATE,
    tanggal_pengembalian DATE,
    FOREIGN KEY (id_peminjam) REFERENCES peminjam(id_peminjam),
    FOREIGN KEY (id_buku) REFERENCES buku(id_buku)
);

-- Dummy Data untuk test Read [cite: 13]
INSERT INTO buku (judul_buku, stok) VALUES ('Teknologi Server', 10), ('Pemrograman Web', 5);
INSERT INTO peminjam (nama, nomor_telepon) VALUES ('Zaky', '08123456789');
-- Tambahkan akun Admin default
-- Email: admin@e6.com, Password: 123
INSERT INTO admin (nama, email, password) VALUES ('Super Admin', 'admin@e6.com', '123');
INSERT INTO admin (nama, email, password) VALUES ('Super Admin 2', 'zaky@e6.com', '815');