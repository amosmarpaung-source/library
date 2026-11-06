const API_URL = 'http://localhost:8080/api/buku';
let halamanSaatIni = 1;
const jumlahPerHalaman = 6;
let dataBukuLokal = [];

// ==========================================
// 1. PENGAMBILAN DATA (API)
// ==========================================
async function ambilDataAPI(page = 1) {
  halamanSaatIni = page;
  const kategori = document.getElementById('filterKategori').value;
  const search = document.getElementById('inputCari').value.trim();

  try {
    const url = `${API_URL}?page=${page}&limit=${jumlahPerHalaman}&kategori=${encodeURIComponent(kategori)}&search=${encodeURIComponent(search)}`;
    const response = await fetch(url);
    if (response.ok) {
      const result = await response.json();
      dataBukuLokal = result.data;
      renderKatalog(result.data);
      renderPagination(result.totalPages, result.currentPage);
    }
  } catch (error) {
    console.error('Error saat menghubungi server:', error);
  }
}

// ==========================================
// 2. RENDER KATALOG BUKU
// ==========================================
function renderKatalog(data) {
  const grid = document.getElementById('gridKatalog');
  grid.innerHTML = '';

  if (!data || data.length === 0) {
    grid.innerHTML = '<p>Buku tidak ditemukan.</p>';
    return;
  }

  for (const buku of data) {
    const isTersedia = buku.status === 'Tersedia';
    const badgeClass = isTersedia ? 'badge-tersedia' : 'badge-dipinjam';
    const gambarBuku = buku.gambar || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80';

    const card = document.createElement('div');
    card.className = 'card-buku';
    card.innerHTML = `
      <!-- KLIK PADA GAMBAR JUGA AKAN MEMBUKA MODAL 3D -->
      <div class="book-cover-wrapper" onclick="tampilkanDetail('${buku.kode}')" title="Klik untuk lihat 3D">
        <img src="${gambarBuku}" alt="${buku.judul}" class="book-cover" />
        <span class="badge ${badgeClass}">${buku.status}</span>
      </div>
      <div class="card-content">
        <h4>${buku.judul}</h4>
        <p><strong>Kode:</strong> ${buku.kode}</p>
        <p><strong>Penulis:</strong> ${buku.penulis}</p>
        <p><strong>Kategori:</strong> ${buku.kategori}</p>
      </div>
      <div class="card-actions">
        <button class="btn-action btn-show" onclick="tampilkanDetail('${buku.kode}')">Show</button>
        <button class="btn-action btn-status" onclick="UbahStatusBuku('${buku.kode}')">Ubah Status</button>
        <button class="btn-action btn-hapus" onclick="hapusBuku('${buku.kode}')">Hapus</button>
      </div>
    `;
    grid.appendChild(card);
  }
}

// ==========================================
// 3. LOGIKA INTERAKSI 3D (FREE ROTATION & DRAG)
// ==========================================
// Variabel penyimpan rotasi 3D
let isDragging = false;
let startMouseX, startMouseY;
let currentRotX = -15; // Posisi Miring Default X
let currentRotY = -25; // Posisi Miring Default Y

function tampilkanDetail(kode) {
  const buku = dataBukuLokal.find(b => b.kode.toUpperCase() === kode.toUpperCase());
  if (!buku) return;

  const gambarBuku = buku.gambar || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80';

  // Isi data ke elemen Buku 3D
  document.getElementById('bukuCover3D').src = gambarBuku;
  document.getElementById('bukuJudulBack').textContent = buku.judul;
  document.getElementById('bukuPenulisBack').innerHTML = `Oleh: <strong>${buku.penulis}</strong>`;
  document.getElementById('bukuKategoriBack').innerHTML = `Kategori: <em>${buku.kategori}</em>`;
  document.getElementById('bukuJudulInfo').textContent = buku.judul;
  document.getElementById('bukuKodeInfo').textContent = `[ ${buku.kode} ] - ${buku.status}`;

  // Tampilkan Modal
  const modal = document.getElementById('modalDetail');
  modal.classList.add('active');

  // Aktifkan Engine Drag 3D
  attachFreeRotation3D();
}

function attachFreeRotation3D() {
  const scene = document.getElementById('scene3D');
  const book3D = document.getElementById('modalBook3D');
  const glow = document.getElementById('modalGlow');

  if (!scene || !book3D || !glow) return;

  // Reset Rotasi ke Awal setiap dibuka
  currentRotX = -15; 
  currentRotY = -25;
  book3D.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
  glow.style.transform = `translate(0px, 0px)`;

  // Event Klik & Tahan (Mouse Down)
  scene.onmousedown = (e) => {
    if (e.target.closest('.btn-close-modal')) return;
    isDragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    book3D.style.transition = 'none'; // Matikan transisi agar gesekan instan/responsif
  };

  // Event Geser (Mouse Move) di seluruh Window (agar tidak lepas saat geser cepat)
  window.onmousemove = (e) => {
    if (!isDragging) return;

    // Kalkulasi jarak geser mouse
    const deltaX = e.clientX - startMouseX;
    const deltaY = e.clientY - startMouseY;

    // Tambahkan rotasi (Sensitivitas diatur dengan faktor pengali)
    currentRotY += deltaX * 0.6; // Geser X memutar sumbu Y (kiri-kanan)
    currentRotX -= deltaY * 0.6; // Geser Y memutar sumbu X (atas-bawah)

    // Terapkan Putaran ke Objek Buku
    book3D.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;

    // Pergerakan Cahaya Glow (Bertolak Belakang dengan Arah Geser)
    const glowX = -deltaX * 0.5;
    const glowY = -deltaY * 0.5;
    glow.style.transform = `translate(${glowX}px, ${glowY}px)`;

    // Perbarui titik awal untuk frame berikutnya
    startMouseX = e.clientX;
    startMouseY = e.clientY;
  };

  // Event Lepas Klik (Mouse Up)
  window.onmouseup = () => {
    if (isDragging) {
      isDragging = false;
      // Kembalikan efek transisi agar mulus jika ditambahkan interaksi lain nanti
      book3D.style.transition = 'transform 0.1s linear';
      // Mengembalikan cahaya glow secara perlahan ke tengah (opsional, menambah efek dinamis)
      glow.style.transition = 'transform 0.5s ease-out';
      glow.style.transform = `translate(0px, 0px)`;
    }
  };
}

function tutupModal() {
  document.getElementById('modalDetail').classList.remove('active');
  isDragging = false; // Pastikan status drag dimatikan
}

// ==========================================
// 4. KONTROL UMUM (CRUD, PAGINATION, DLL)
// ==========================================
function renderPagination(totalPages, currentPage) {
  const container = document.getElementById('paginationContainer');
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const btnPrev = document.createElement('button');
  btnPrev.className = 'btn-page';
  btnPrev.innerHTML = '&laquo; Prev';
  btnPrev.disabled = currentPage === 1;
  btnPrev.onclick = () => ambilDataAPI(currentPage - 1);
  container.appendChild(btnPrev);

  for (let i = 1; i <= totalPages; i++) {
    const btnNum = document.createElement('button');
    btnNum.className = `btn-page ${i === currentPage ? 'active' : ''}`;
    btnNum.textContent = i;
    btnNum.onclick = () => ambilDataAPI(i);
    container.appendChild(btnNum);
  }

  const btnNext = document.createElement('button');
  btnNext.className = 'btn-page';
  btnNext.innerHTML = 'Next &raquo;';
  btnNext.disabled = currentPage === totalPages;
  btnNext.onclick = () => ambilDataAPI(currentPage + 1);
  container.appendChild(btnNext);
}

async function tambahBuku(event) {
  event.preventDefault();
  const kode = document.getElementById('kodeBuku').value.trim();
  const judul = document.getElementById('judulBuku').value.trim();
  const penulis = document.getElementById('penulisBuku').value.trim();
  const kategori = document.getElementById('kategoriBuku').value;
  const bukuBaru = { kode, judul, penulis, kategori };

  try {
    const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bukuBaru) });
    if (res.ok) { document.getElementById('formTambahBuku').reset(); ambilDataAPI(halamanSaatIni); }
  } catch (err) { console.error(err); }
}

async function UbahStatusBuku(kode) {
  try {
    const res = await fetch(`${API_URL}/${kode}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
    if (res.ok) ambilDataAPI(halamanSaatIni);
  } catch (err) { console.error(err); }
}

async function hapusBuku(kode) {
  if (!confirm(`Hapus buku ${kode}?`)) return;
  try {
    const res = await fetch(`${API_URL}/${kode}`, { method: 'DELETE' });
    if (res.ok) ambilDataAPI(halamanSaatIni);
  } catch (err) { console.error(err); }
}

function tanganiAutoSuggest() {
  const keyword = document.getElementById('inputCari').value.toLowerCase();
  const suggestBox = document.getElementById('suggestBox');
  suggestBox.innerHTML = '';
  ambilDataAPI(1);

  if (keyword.trim() === '') { suggestBox.style.display = 'none'; return; }
  const hasilSaran = dataBukuLokal.filter(b => b.judul.toLowerCase().includes(keyword) || b.penulis.toLowerCase().includes(keyword));
  
  if (hasilSaran.length > 0) {
    suggestBox.style.display = 'block';
    hasilSaran.forEach(buku => {
      const li = document.createElement('li');
      li.textContent = `${buku.judul} (${buku.penulis})`;
      li.onclick = () => { document.getElementById('inputCari').value = buku.judul; suggestBox.style.display = 'none'; ambilDataAPI(1); };
      suggestBox.appendChild(li);
    });
  } else { suggestBox.style.display = 'none'; }
}

function filterBuku() { ambilDataAPI(1); }
function bukaTab(event, idSection) {
  event.preventDefault();
  document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
  document.querySelectorAll('.navbar nav a').forEach(nav => nav.classList.remove('active'));
  document.getElementById(idSection).style.display = 'block';
  event.currentTarget.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => ambilDataAPI(1));