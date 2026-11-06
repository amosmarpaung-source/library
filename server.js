// server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Simulasi Database dengan Gambar Sampul Buku
let katalogBuku = [
  { kode: 'BK-001', judul: 'Pemrograman Web dengan JavaScript', penulis: 'Amos Milan', kategori: 'Pemrograman', status: 'Tersedia', gambar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80' },
  { kode: 'BK-002', judul: 'Analisis Sistem Informasi Kampus', penulis: 'Nataniel S.', kategori: 'Sistem Informasi', status: 'Tersedia', gambar: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80' },
  { kode: 'BK-003', judul: 'Dasar-Dasar Jaringan Komputer', penulis: 'Aldi Pratama', kategori: 'Jaringan', status: 'Dipinjam', gambar: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80' },
  { kode: 'BK-004', judul: 'Struktur Data dan Algoritma', penulis: 'Eikhel Tarigan', kategori: 'Pemrograman', status: 'Tersedia', gambar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80' },
  { kode: 'BK-005', judul: 'Perancangan Basis Data Relasional', penulis: 'Pedro Simaremare', kategori: 'Sistem Informasi', status: 'Tersedia', gambar: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80' },
  { kode: 'BK-006', judul: 'Keamanan & Sistem Terdistribusi', penulis: 'Amos Milan', kategori: 'Jaringan', status: 'Dipinjam', gambar: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80' }
];

// READ (GET dengan Pagination & Filter)
app.get('/api/buku', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const kategori = req.query.kategori;
  const search = req.query.search;

  let hasil = [...katalogBuku];

  if (kategori && kategori !== 'semua') {
    hasil = hasil.filter(b => b.kategori === kategori);
  }

  if (search) {
    const kw = search.toLowerCase();
    hasil = hasil.filter(b => b.judul.toLowerCase().includes(kw) || b.penulis.toLowerCase().includes(kw));
  }

  const totalItems = hasil.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const dataPaged = hasil.slice(startIndex, startIndex + limit);

  res.status(200).json({ totalItems, totalPages, currentPage: page, limit, data: dataPaged });
});

// READ Single
app.get('/api/buku/:kode', (req, res) => {
  const buku = katalogBuku.find(b => b.kode.toUpperCase() === req.params.kode.toUpperCase());
  if (!buku) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  res.status(200).json(buku);
});

// CREATE (POST)
app.post('/api/buku', (req, res) => {
  const { kode, judul, penulis, kategori, gambar } = req.body;
  if (!kode || !judul || !penulis || !kategori) {
    return res.status(400).json({ message: 'Semua kolom data buku wajib diisi!' });
  }

  const duplikat = katalogBuku.some(b => b.kode.toUpperCase() === kode.toUpperCase());
  if (duplikat) return res.status(409).json({ message: `Kode buku ${kode} sudah terdaftar!` });

  const bukuBaru = {
    kode: kode.toUpperCase(),
    judul,
    penulis,
    kategori,
    status: 'Tersedia',
    gambar: gambar || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80'
  };

  katalogBuku.unshift(bukuBaru);
  res.status(201).json({ message: 'Buku berhasil ditambahkan', data: bukuBaru });
});

// UPDATE (PUT)
app.put('/api/buku/:kode', (req, res) => {
  const index = katalogBuku.findIndex(b => b.kode.toUpperCase() === req.params.kode.toUpperCase());
  if (index === -1) return res.status(404).json({ message: 'Buku tidak ditemukan' });

  const statusLama = katalogBuku[index].status;
  katalogBuku[index].status = req.body.status || (statusLama === 'Tersedia' ? 'Dipinjam' : 'Tersedia');

  res.status(200).json({ message: 'Status berhasil diperbarui', data: katalogBuku[index] });
});

// DELETE
app.delete('/api/buku/:kode', (req, res) => {
  const index = katalogBuku.findIndex(b => b.kode.toUpperCase() === req.params.kode.toUpperCase());
  if (index === -1) return res.status(404).json({ message: 'Buku tidak ditemukan' });

  const dihapus = katalogBuku.splice(index, 1);
  res.status(200).json({ message: 'Buku berhasil dihapus', data: dihapus[0] });
});

app.listen(PORT, () => console.log(`Server REST API Express berjalan di http://localhost:${PORT}`));