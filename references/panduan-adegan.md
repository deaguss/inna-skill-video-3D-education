# Panduan Mengarahkan Adegan

Baca ini sebelum mengubah `animasi/cerita.js` dan `animasi/overlay.js`. Keduanya berisi contoh lengkap dari video money management, jadi tiru polanya.

## Cara kerja timeline

- Setiap adegan di `naskah.json` punya `id`. `cerita.js` memakai `a.id` untuk memilih pose dan kamera, jadi perbarui `case` dan `a.id === ...` kalau urutan adegan berubah.
- Durasi memakai `durasi_detik` kalau ada, kalau tidak dihitung dari jumlah kata.
- `TAMBAHAN` di `cerita.js` menambah waktu untuk adegan yang visualnya butuh jeda.
- Semua keadaan dihitung dari waktu `t`, tanpa menyimpan state. Pertahankan ini, karena setiap frame dirender acak dan beberapa kali per sampel.
- `pembicara: "arga"` adalah narator tanpa avatar. Saat dia bicara, Raka dan Dina membeku pada pose terakhir.
- Langkah trade diambil dari `ke(7)` dan `ke(12)` di `buatCerita`. Ganti id-nya, atau hapus kalau video tidak memakai tumpukan koin.

## Koordinat dunia

Satuan bebas. `x` ke kanan layar, `y` ke atas, `z` ke arah kamera.

| Objek | Posisi |
|---|---|
| Raka | x -0,85, z -0,05, pusat kepala y sekitar 1,67 |
| Dina | x 0,85, z -0,05 |
| Permukaan meja | y 0,87 |
| Tumpukan koin | x ±0,2, z 0,78 |
| Monitor | x ±1,9, tengah layar y 1,62 |
| Laptop Raka | x -1,25, z 0,62 |
| Batang grafik | x ±0,62, z 2,0 |
| Dinding | z -3,2 |

## Kamera

Lebar yang terlihat pada jarak `d` adalah `2 × d × tan(fov/2) × 0,5625`. Format vertikal itu sempit, jadi hitung dulu sebelum menaruh dua objek dalam satu frame.

| Bidikan | Posisi kamera | Target | fov |
|---|---|---|---|
| Berdua penuh | [0, 2, 10,2] | [0, 1,6, 0,4] | 28 |
| Close-up Raka | [-0,85, 1,72, 4,1] | [-0,85, 1,72, 0] | 26 |
| Karakter dan monitor | [∓1,45, 1,6, 8,3] | [∓1,45, 1,5, 0,2] | 27 |
| Tumpukan koin | [0, 1,6, 5,1] | [0, 1,14, 0,78] | 22 |
| Tangan di meja | [0,78, 1,4, 2,8] | [0,68, 0,98, 0,8] | 28 |

`ap` adalah bukaan lensa dan hanya aktif pada 6 sampel atau lebih. Fungsi `bergerak` memindahkan kamera sepanjang adegan.

## Pose karakter

```js
{
  pos: [x, y, z],        // y 0,6 untuk duduk
  yaw, lean, roll,       // badan
  hy, hp, hr,            // kepala: toleh, angguk, miring
  gx, gy,                // arah pandang, -1 sampai 1
  aN: [rx, rz, siku],    // lengan di sisi x negatif
  aP: [rx, rz, siku],    // lengan di sisi x positif
  lN: [paha, lutut],     // kaki
  lP: [paha, lutut],
  keringat,              // 0 sampai 1, opsional
  muka: { alis, alisY, alisBeda, mata, pupil, kedip, senyum, lebar, buka },
}
```

- `rx` negatif mengangkat lengan ke depan, -1,5 berarti lurus ke depan.
- `rz` mengayunkan lengan ke samping. Untuk arah `(dx, dy, dz)`, pakai `rz = asin(dx)` dan `rx = atan2(-dz, -dy)`.
- `siku` negatif menekuk siku ke depan.
- Lengan hanya sepanjang sekitar 0,66. Kalau tidak sampai, condongkan badan dengan `lean` atau geser objeknya.
- `senyum` positif berarti senyum, negatif berarti cemberut. `buka` di atas 0,04 mengganti garis mulut dengan mulut terbuka.
- `alis` positif terlihat sedih atau kaget, negatif terlihat percaya diri atau marah.

Ekspresi tersedia di `MUKA`: santai, penasaran, nyeletuk, serius, tenang, jahil, percaya diri, mengejek, syok, memaksa senyum, senang, lesu, yakin, malu.

## Overlay 2D

Kanvas akhir berukuran 720×1280.

- Subtitle mulai di y 150, dan tiga baris berakhir sekitar y 290. Taruh grafik di bawah y 300.
- Hindari sekitar 20% bagian bawah dan sisi kanan, karena tertutup tombol TikTok dan Reels.
- `pop((lokal - mulai) / 0,4)` memberi animasi muncul memantul.
- `proyeksi(x, y, z)` mengubah posisi 3D menjadi posisi layar.
- Batasi label yang mengikuti objek dengan `Math.max` dan `Math.min`, supaya tidak menabrak subtitle atau keluar frame.
- Jangan pakai `ctx.filter` berulang-ulang.
