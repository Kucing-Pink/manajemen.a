# ExamReady — Platform Latihan Ujian Online

Platform ujian online interaktif berbasis web statis. Dibangun dengan HTML, CSS, dan JavaScript murni — tanpa framework, ringan, dan siap di-host di GitHub Pages.

## 🚀 Cara Host di GitHub Pages

1. **Upload folder `ujian-online/` ke repository GitHub Anda** (atau upload semua isinya ke root repository)
2. Buka **Settings → Pages** di repository Anda
3. Pilih branch `main` dan folder `/root` (atau `/docs` jika Anda taruh di sana)
4. Klik **Save** — website akan live dalam beberapa menit

> **Catatan**: File `.nojekyll` sudah disertakan agar GitHub Pages tidak memproses file sebagai Jekyll.

## 📁 Struktur File

```
ujian-online/
├── index.html          # Halaman login (kode 4 angka)
├── courses.html        # Daftar mata kuliah
├── exam.html           # Halaman ujian
├── result.html         # Halaman hasil & review
├── .nojekyll           # Untuk GitHub Pages
├── css/
│   └── style.css       # Semua styling
├── js/
│   ├── app.js          # Utility global (session, fetch)
│   ├── login.js        # Logika login
│   ├── courses.js      # Logika daftar mata kuliah
│   ├── exam.js         # Logika ujian
│   └── result.js       # Logika hasil
├── data/
│   ├── codes.txt       # Kode akses valid (1 per baris)
│   └── courses.json    # Daftar mata kuliah
└── questions/
    └── econ4102.json   # Bank soal Pengantar Ekonomi Mikro
```

## 🔑 Mengelola Kode Akses

Edit file `data/codes.txt` — satu kode 4 angka per baris:
```
1234
5678
9012
```

## ➕ Menambah Mata Kuliah Baru

1. Buat file soal baru di `questions/namaMK.json` dengan format:
```json
[
  {
    "id": 1,
    "question": "Pertanyaan di sini?",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "answer": 0
  }
]
```
(`answer` adalah index 0-3, di mana 0=A, 1=B, 2=C, 3=D)

2. Tambahkan entri di `data/courses.json`:
```json
{
  "id": "namaMK",
  "name": "Nama Mata Kuliah",
  "code": "KODE123",
  "icon": "📖",
  "description": "Deskripsi singkat.",
  "totalQuestions": 50,
  "file": "questions/namaMK.json"
}
```

## ⌨️ Shortcut Keyboard

| Tombol | Fungsi |
|--------|--------|
| `1` `2` `3` `4` | Pilih opsi jawaban |
| `Enter` | Lanjut ke soal berikutnya |
| `Backspace` | Hapus digit kode (di halaman login) |

## 📊 Fitur

- ✅ Login dengan kode 4 angka unik
- ✅ Daftar mata kuliah dinamis
- ✅ Soal pilihan ganda interaktif
- ✅ Koreksi instan (hijau = benar, merah = salah)
- ✅ Progress bar per soal
- ✅ Halaman hasil dengan skor & review lengkap
- ✅ Responsif (mobile & desktop)
- ✅ Tanpa backend / database
