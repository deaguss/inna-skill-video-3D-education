# video-edukasi-3d

Skill Claude Code untuk membuat video animasi edukasi 3D bergaya clay lewat kode, dari naskah sampai MP4 vertikal. Tanpa software 3D dan tanpa menggambar manual.

*A Claude Code skill that turns a script into a vertical 3D clay-style explainer video using Three.js, Puppeteer, and FFmpeg. The script and docs are in Indonesian.*

Contoh yang disertakan adalah seri "Raka vs Dina" tentang money management di trading, tapi set dan karakternya bisa diubah untuk topik lain.

## Yang dikerjakan skill ini

1. Menulis naskah JSON: dialog, ekspresi, kamera, dan visual tiap adegan.
2. Mengarahkan adegan dengan kode: pose, kamera, grafik, dan subtitle.
3. Merender frame uji lewat CPU dengan batas waktu, supaya laptop tidak freeze.
4. Mengukur durasi suara per adegan dan menyesuaikan timing animasi.
5. Merender video penuh dan menggabungkannya dengan suara.

## Pasang

Salin folder ini ke folder skill Claude Code:

```bash
git clone https://github.com/deaguss/inna-skill-video-3D-education.git ~/.claude/skills/video-edukasi-3d
```

Lalu minta ke Claude Code, misalnya: "Bikin video animasi 3D tentang stop loss, 45 detik, buat TikTok."

Butuh Node.js 18 atau lebih baru. Saat proyek video pertama dibuat, npm mengunduh Three.js, Chrome, dan FFmpeg ke folder proyek, totalnya sekitar 800 MB.

## Batasan

- Hasil terbaik saat ini kualitas preview (540×960 dirender lewat CPU, keluaran 720×1280), tanpa blur kamera asli.
- Suara tidak dibuat oleh skill ini. Siapkan rekaman sendiri atau hasil layanan TTS.
- Bibir hanya buka-tutup, bukan lip-sync presisi.
- Render lewat GPU bisa membebani laptop dengan GPU terintegrasi, jadi defaultnya CPU.
- Sejauh ini diuji di Windows 11.

## Disclaimer

Contoh angka trading di repo ini adalah ilustrasi hipotetis, bukan saran investasi. Trading berisiko rugi. Kamu bertanggung jawab atas konten yang kamu publikasikan, termasuk kepatuhan pada aturan setempat dan kebijakan platform.

## Lisensi

[MIT](LICENSE)
