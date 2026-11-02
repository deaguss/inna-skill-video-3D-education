// Grafik 2D khusus per adegan: label, papan skor, ikon. Sesuaikan untuk setiap video.
export function gambarKhusus({ ctx, kotakTeks, proyeksi, halus, pop, rp, W, FONT, WARNA, cerita }, k) {
  const { a, lokal } = k;

  if (a.id === 1) {
    const [rx, ry] = proyeksi(-0.85, 2.36, -0.05);
    const [dx, dy] = proyeksi(0.85, 2.36, -0.05);
    ctx.globalAlpha = halus(0.1, 0.5, lokal);
    kotakTeks(['Raka'], Math.max(70, rx), Math.max(265, ry - 40), 30, WARNA.raka);
    ctx.globalAlpha = halus(0.7, 1.1, lokal);
    kotakTeks(['Dina'], Math.min(W - 70, dx), Math.max(265, dy - 40), 30, WARNA.dina);
    ctx.globalAlpha = 1;
  }

  if (a.id === 2) {
    const skala = pop((lokal - (a.durasi - 1.4)) / 0.4);
    if (skala > 0) {
      ctx.save();
      ctx.translate(W / 2, 400);
      ctx.scale(skala, skala);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd27a';
      ctx.font = `800 130px ${FONT}`;
      ctx.fillText('?', 0, 0);
      ctx.restore();
    }
  }

  if (a.id === 6) {
    const skala = pop(lokal / 0.45);
    ctx.save();
    ctx.translate(W / 2, 400);
    ctx.scale(skala, skala);
    ctx.fillStyle = 'rgba(16,20,34,.9)';
    ctx.beginPath();
    ctx.roundRect(-285, -80, 570, 160, 26);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 62px ${FONT}`;
    ctx.fillStyle = '#3ddc97';
    ctx.fillText('4 M', -175, -18);
    ctx.fillStyle = '#ff5a5f';
    ctx.fillText('6 K', 0, -18);
    ctx.fillStyle = '#ffd27a';
    ctx.fillText('1:2', 175, -18);
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = '#c6cede';
    ctx.fillText('menang', -175, 42);
    ctx.fillText('kalah', 0, 42);
    ctx.fillText('risiko : untung', 175, 42);
    ctx.restore();
  }

  if (a.id === 7 || a.id === 12) {
    const nilaiR = cerita.kurvaRaka[k.trade];
    const nilaiD = cerita.kurvaDina[k.trade];
    kotakTeks([`Trade ${k.trade}/10`], W / 2, 245, 26, '#ffd27a');
    kotakTeks([`Raka ${rp(nilaiR)}`], W / 2 - 170, 310, 30, '#ff8a7a');
    kotakTeks([`Dina ${rp(nilaiD)}`], W / 2 + 170, 310, 30, '#6fe3cf');
  }

  if (a.id === 11) {
    const g = halus(1.1, 1.6, lokal);
    ctx.globalAlpha = g;
    const [rx] = proyeksi(-0.62, 2, 2);
    const [dx, dy] = proyeksi(0.62, 0.3, 2);
    kotakTeks(['+316%'], rx, 620, 50, '#fff', 'rgba(170,30,40,.92)', 800);
    kotakTeks(['+8,4%'], dx, dy - 96, 46, '#fff', 'rgba(20,130,90,.92)', 800);
    ctx.globalAlpha = 1;
  }

  if (a.id === 16) {
    const tile = [
      ['%', 'Risiko per trade'],
      ['⛨', 'Stop loss'],
      ['⚖', 'Ukuran posisi'],
    ];
    tile.forEach(([ikon, label], i) => {
      const s = pop((lokal - 0.3 - i * (a.durasi - 1.4) / 2) / 0.4);
      if (s <= 0) return;
      const cx = 130 + i * 230;
      ctx.save();
      ctx.translate(cx, 415);
      ctx.scale(s, s);
      ctx.fillStyle = 'rgba(16,20,34,.92)';
      ctx.beginPath();
      ctx.roundRect(-105, -85, 210, 170, 24);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd27a';
      ctx.font = `800 70px ${FONT}`;
      ctx.fillText(ikon, 0, -22);
      ctx.fillStyle = '#e8ecf5';
      ctx.font = `600 22px ${FONT}`;
      ctx.fillText(label, 0, 48);
      ctx.restore();
    });
  }
}
