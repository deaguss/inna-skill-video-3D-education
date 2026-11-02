---
name: video-edukasi-3d
description: Membuat video animasi edukasi 3D bergaya clay lewat kode (Three.js, Puppeteer, FFmpeg), dari naskah sampai MP4 vertikal untuk TikTok, Reels, atau Shorts. Gunakan skill ini setiap kali pengguna ingin membuat video animasi, video edukasi, explainer, konten animasi 3D, atau seri "Raka vs Dina", termasuk ketika mereka hanya menyebut topik seperti "bikinin video soal stop loss" atau mengirim contoh video yang ingin ditiru gayanya. Also use for 3D animated explainer videos made with code.
---

# Video Edukasi 3D

Skill ini mengubah topik menjadi video vertikal 3D bergaya clay tanpa software 3D. Karakter, set, kamera, dan subtitle semuanya kode.

Pengguna biasanya bukan programmer. Jelaskan dengan bahasa sehari-hari, gunakan bahasa pengguna, dan tunjukkan hasil, bukan kode.

Panduan ini berlaku untuk AI apa pun yang bisa membaca file dan menjalankan perintah. Sesuaikan kalau alatnya terbatas:

- **Tidak bisa melihat gambar:** minta pengguna memeriksa `lembar.png`, lalu perbaiki sesuai laporan mereka. Jangan mengaku sudah memeriksa gambar.
- **Tidak bisa menjalankan proses di latar belakang:** berikan perintah render penuh untuk dijalankan pengguna di terminal, supaya perintahnya tidak terputus karena batas waktu.
- **Tidak bisa menjalankan perintah sama sekali:** bantu naskah dan kode, lalu berikan perintahnya satu per satu untuk dijalankan pengguna.

## Alur kerja

Kerjakan berurutan. Revisi naskah gratis, sedangkan render makan waktu, jadi minta persetujuan sebelum tahap yang mahal.

### 1. Tentukan brief

Tanyakan hanya yang belum jelas: topik, penonton, durasi, dan platform. Akun baru lebih cocok 30–45 detik. Kalau pengguna mengirim video contoh, ambil gayanya dari beberapa frame, tapi buat karakter sendiri. Jangan menjiplak karakter orang lain atau mengunduh videonya.

### 2. Tulis naskah

Salin `assets/template/` ke folder proyek, lalu tulis ulang `naskah.json`. Formatnya bisa dilihat dari contoh di dalamnya.

- Buka dengan momen paling menarik, karena penonton memutuskan lanjut atau tidak dalam beberapa detik pertama.
- Pisahkan `suara` (angka dieja) dari `subtitle` (angka berupa digit).
- Kalau ada angka, hitung dengan skrip dan simpan datanya di `simulasi`. Jangan mengira-ngira, karena angka yang salah merusak kepercayaan pada konten edukasi.
- Estimasi durasi: jumlah kata dibagi 2,5, ditambah sekitar 0,5 detik per adegan.
- Untuk topik keuangan, tampilkan disclaimer di `penutup_layar`, tandai contoh sebagai hipotetis, dan hindari sinyal beli/jual atau janji profit.

Tunjukkan naskahnya sebagai tabel dialog dan minta persetujuan sebelum lanjut.

### 3. Pasang alat

Jalankan `npm install` di folder proyek, tanpa instalasi global. Sebelumnya, beri tahu pengguna bahwa Three.js, Chrome, dan FFmpeg akan terunduh sekitar 800 MB, lalu minta izin. `.puppeteerrc.cjs` menyimpan Chrome di folder proyek. Kalau npm melewati script instalasi, baca dulu script-nya lalu jalankan `npm install-scripts approve ffmpeg-static puppeteer` dan `npm rebuild ffmpeg-static puppeteer`.

### 4. Arahkan adegan

Baca `references/panduan-adegan.md`, lalu sesuaikan dua file khusus video:

- `animasi/cerita.js`: pose karakter dan kamera per adegan
- `animasi/overlay.js`: label, papan skor, dan ikon per adegan

`karakter.js`, `dunia.js`, `main.js`, dan `render.mjs` adalah mesin. Ubah hanya kalau video butuh properti atau karakter baru.

### 5. Uji frame

Render frame dari setiap adegan, gabungkan jadi lembar kontak, lalu periksa dan perbaiki sendiri sebelum menunjukkannya ke pengguna:

```bash
node render.mjs --ringan --skala 0.75 --sampel 4 --batas 150 --still 1,8,12,17 --out uji
node lembar.mjs uji lembar.png
```

Periksa: wajah terpotong, subjek tertutup, label menumpuk subtitle, dan angka di layar yang tidak cocok dengan naskah. Tahapan perlu diulang setelah perubahan, karena perbaikan satu adegan bisa merusak framing adegan lain.

### 6. Render preview pendek

Render sekitar 10 detik pertama, periksa, lalu kirim ke pengguna. Minta mereka menilai gerakan, karena potongan frame tidak menunjukkan gerakan yang kaku.

```bash
node render.mjs --ringan --skala 0.75 --sampel 4 --batas 900 --dari 0 --sampai 10 --out preview.mp4
```

### 7. Pasang suara

Ini sebelum render final, karena durasi suara menentukan timing animasi. Pengguna menyiapkan satu file per adegan di `suara/`, dengan nama sesuai id adegan: `01.wav`, `02.mp3`, dan seterusnya.

```bash
node suara.mjs ukur
```

Perintah di atas menulis `durasi_detik` ke `naskah.json`. Cek lagi suara bawaan sistem sebelum menawarkannya, karena Windows sering hanya punya suara bahasa Inggris. API key layanan TTS tetap dipegang pengguna, dan jangan minta mereka menempelkannya di chat.

### 8. Render penuh

Sebutkan perkiraan waktu dari kecepatan yang terukur, lalu minta persetujuan. Render di latar belakang dan ingatkan pengguna supaya laptop tidak sleep.

```bash
node render.mjs --ringan --skala 0.75 --sampel 4 --batas 5400 --out video.mp4
node suara.mjs gabung video.mp4 video-final.mp4
```

Setelah selesai, ambil frame dari video jadinya dan periksa sebelum mengirimkannya.

## Keamanan laptop

Render yang terlalu berat bisa membuat laptop freeze dan pekerjaan yang belum disimpan bisa hilang.

- Selalu pakai `--ringan` sebagai default. Opsi ini memaksa render lewat CPU dan membatalkan render kalau browser tidak memakai renderer CPU.
- Selalu pasang `--batas` sebagai pengaman waktu.
- Di Windows, jalankan dengan prioritas rendah dan separuh core:
  ```bash
  cmd /c "start \"\" /b /low /affinity 3F /wait node render.mjs ..."
  ```
  `3F` berarti 6 core. Hitung dari jumlah core laptop yang dipakai. Di macOS atau Linux, pakai `nice -n 19`.
- Mulai dari satu frame. Kalau uji gagal atau kena batas waktu, berhenti dan tanya pengguna. Jangan mencoba ulang berkali-kali dengan variasi lain.
- Render lewat GPU hanya dengan izin khusus, satu frame dulu, dan setelah pengguna diingatkan untuk menyimpan pekerjaannya.
- Jangan menghapus file tanpa izin. Simpan hasil uji baru di folder baru.

## Kualitas dan batas

| Setelan | Kegunaan |
|---|---|
| `--skala 0.75 --sampel 4` | Preview dan rilis di CPU. Tanpa blur kamera asli. |
| `--sampel 6` atau lebih | Mengaktifkan blur kamera dan bayangan lembut. Pakai minimal 16 supaya tidak berbayang. Jauh lebih lambat. |

Sebagai gambaran, setelan pertama butuh sekitar 0,85 detik per frame di laptop dengan 6 core untuk render, jadi video 84 detik selesai sekitar 35 menit. Ukur ulang di tiap laptop.

## Kesalahan yang sudah pernah terjadi

- **Frame pertama macet berapa pun backend-nya:** biasanya kanvas 2D. `ctx.filter = 'blur()'` untuk ribuan bentuk membuat render macet dan diduga menyebabkan freeze. Gambar satu sprite bergradasi lalu pakai `drawImage`.
- **Gambar berbayang ganda:** blur kamera aktif dengan sampel terlalu sedikit. `main.js` sudah mematikannya di bawah 6 sampel.
- **Timer pengaman membuat proses tidak selesai:** akhiri skrip dengan `process.exit(0)`.
- **Kata "PT" pada logo:** di Indonesia terbaca sebagai perseroan terbatas.
