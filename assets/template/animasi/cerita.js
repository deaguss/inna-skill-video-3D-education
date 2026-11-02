const halus = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

export const WARNA = { raka: '#ff8a7a', dina: '#6fe3cf' };

const TAMBAHAN = { 7: 1.4, 11: 0.8, 12: 1.9, 18: 0.7, 20: 0.8 };
const DURASI_PENUTUP = 3.4;

const MUKA = {
  santai: { alis: 0, mata: 1, senyum: 0.6 },
  penasaran: { alis: 0.05, alisBeda: 0.03, mata: 1.05, senyum: 0.2 },
  nyeletuk: { alis: -0.1, alisBeda: 0.035, mata: 0.92, senyum: 0.85 },
  serius: { alis: -0.18, alisY: -0.01, mata: 0.95, senyum: 0.1 },
  tenang: { alis: 0.02, mata: 0.92, senyum: 0.5 },
  jahil: { alis: -0.16, alisBeda: 0.03, mata: 0.82, senyum: 0.9 },
  'percaya diri': { alis: -0.14, alisY: 0.01, mata: 0.92, senyum: 0.95 },
  mengejek: { alis: -0.1, alisY: 0.02, mata: 0.6, senyum: 1, lebar: 1.25 },
  syok: { alis: 0.4, alisY: 0.06, mata: 1.32, pupil: 0.62, senyum: -0.4 },
  'memaksa senyum': { alis: 0.32, alisY: 0.03, mata: 1.12, pupil: 0.72, senyum: 1.1, lebar: 1.3 },
  senang: { alis: 0.08, alisY: 0.02, mata: 0.8, senyum: 1.15, lebar: 1.2 },
  lesu: { alis: 0.42, alisY: -0.02, mata: 0.72, senyum: -0.7 },
  yakin: { alis: -0.14, mata: 1, senyum: 0.8 },
  malu: { alis: 0.3, alisY: 0.01, mata: 0.92, senyum: -0.25, lebar: 0.75 },
};

const kedipan = (t, geser) => {
  const u = (t + geser) % 3.3;
  return u < 0.13 ? Math.sin((u / 0.13) * Math.PI) : 0;
};
const gerakBibir = (lokal, durasi) => {
  if (lokal > durasi - 0.3 || lokal < 0.05) return 0;
  return Math.abs(Math.sin(lokal * 8.5)) * (0.55 + 0.45 * Math.sin(lokal * 3.3 + 1));
};

function dasarDuduk(x, z = -0.05) {
  return {
    pos: [x, 0.6, z],
    yaw: 0,
    lean: 0.06,
    aN: [-1.2, 0.1, -0.55],
    aP: [-1.2, -0.1, -0.55],
    lN: [-1.45, 1.45],
    lP: [-1.45, 1.45],
    hy: 0,
    hp: 0,
    hr: 0,
    gx: 0,
    gy: 0,
  };
}

function poseRaka(a, lokal) {
  const p = dasarDuduk(-0.85);
  const u = a ? lokal / a.durasi : 0;
  p.hy = -0.42;
  p.gx = -0.6;
  let muka = 'tenang';
  if (!a) return { ...p, muka: { ...MUKA[muka] } };
  muka = a.ekspresi;
  const masuk = halus(0, 0.3, lokal);

  if (a.id === 3) {
    p.lean = lerp(0.06, 0.26, halus(0.4, 1.2, lokal));
    p.hy = lerp(-0.42, 0.08, masuk);
    p.gx = 0;
    p.hp = -0.1;
    p.aP = [lerp(-1.2, -1.42, halus(0.4, 1.2, lokal)), lerp(-0.1, -0.35, masuk), -0.25];
  } else if (a.id === 5) {
    const goyang = Math.sin(lokal * 15);
    p.hy = 0.5;
    p.gx = 0.7;
    p.hp = -0.2 + goyang * 0.045;
    p.lean = -0.08 + goyang * 0.03;
    p.pos[1] += Math.abs(goyang) * 0.02;
  } else if (a.id === 8) {
    const tarik = halus(0, 0.22, lokal);
    p.hy = lerp(-0.42, -0.1, tarik);
    p.hp = -0.12;
    p.gx = -0.5;
    p.lean = -0.06 * tarik;
    p.aN = [-2.65 * tarik - 1.2 * (1 - tarik), 0.48, -1.75 * tarik - 0.55 * (1 - tarik)];
    p.aP = [-2.65 * tarik - 1.2 * (1 - tarik), -0.48, -1.75 * tarik - 0.55 * (1 - tarik)];
  } else if (a.id === 10) {
    p.hy = lerp(-0.1, 0.3, masuk);
    p.gx = 0.3;
    p.hr = -0.05;
    p.keringat = (lokal * 0.65) % 1;
  } else if (a.id === 14) {
    const turun = halus(0.1, 0.9, lokal);
    p.lean = 0.06 + 0.2 * turun;
    p.hy = -0.35;
    p.gx = -0.5;
    p.gy = -0.3;
    p.hp = 0.28 * turun;
  } else if (a.id === 17) {
    p.hy = 0.1;
    p.hp = Math.max(0, Math.sin(lokal * 7)) * 0.22 * (1 - u);
    p.aP = [-1.5, -0.05, -1.45];
  } else if (a.id === 20) {
    const noleh = halus(0.3, 1.0, lokal);
    p.hy = lerp(0.1, -0.78, noleh);
    p.gx = -0.8 * noleh;
    p.gy = 0.4 * noleh;
    p.keringat = (lokal * 0.6) % 1;
  }
  return { ...p, muka: { ...MUKA[muka] } };
}

function poseDina(a, lokal, ketik) {
  const p = dasarDuduk(0.85);
  p.hy = 0.42;
  p.gx = 0.6;
  p.aN[0] += Math.sin(ketik * 13) * 0.025;
  p.aP[0] += Math.sin(ketik * 13 + 2) * 0.025;
  if (!a) return { ...p, muka: { ...MUKA.tenang } };
  const muka = a.ekspresi;
  const masuk = halus(0, 0.3, lokal);
  if (a.id === 4) {
    p.hy = lerp(0.42, -0.3, masuk);
    p.gx = -0.5;
    p.gy = -0.5;
    p.hp = 0.2;
    p.lean = 0.2;
    p.aN = [-1.42, 0.2, -0.3];
  } else if (a.id === 9) {
    p.hy = lerp(0.42, 0.05, masuk);
    p.gx = 0;
    p.hr = 0.08;
  } else if (a.id === 13) {
    p.hy = 0.25;
    p.gx = 0.3;
    p.hr = Math.sin(lokal * 5) * 0.05;
    p.pos[1] += Math.abs(Math.sin(lokal * 6)) * 0.02;
  } else if (a.id === 18) {
    const dorong = halus(0, 0.75, lokal);
    const raih = halus(0.65, 1.15, lokal);
    p.pos[0] = lerp(0.85, 0.05, dorong);
    p.lean = lerp(0.06, 0.3, raih);
    p.hy = lerp(0.1, -0.55, dorong);
    p.gx = -0.6;
    p.gy = -0.3;
    p.hp = 0.1;
    p.aN = [lerp(-1.2, -1.63, raih), lerp(0.1, -0.67, raih), lerp(-0.55, -0.02, raih)];
  } else if (a.id === 20) {
    p.pos[0] = 0.05;
    p.hy = -0.6;
    p.gx = -0.6;
  }
  return { ...p, muka: { ...MUKA[muka] } };
}

function kamera(a, lokal) {
  const u = halus(0, a.durasi, lokal);
  const cepat = halus(0, 0.32, lokal);
  const S = (pos, target, fov, ap, progres = u) => ({ pos, target, fov, ap, progres });
  const bergerak = (p0, p1, t0, t1, fov, ap, progres = u) => ({
    pos: lerp3(p0, p1, progres),
    target: lerp3(t0, t1, progres),
    fov,
    ap,
  });
  const hadapRaka = [-1.45, 1.5, 0.2];
  const hadapDina = [1.45, 1.5, 0.2];
  switch (a.id) {
    case 1: return bergerak([0, 1.85, 8], [0, 2.0, 11.5], [0, 1.28, 0.7], [0, 1.45, 0.7], 28, 0.03);
    case 2: return bergerak([0, 1.65, 6.6], [0, 1.6, 5.4], [0, 1.2, 0.78], [0, 1.2, 0.78], 24, 0.03);
    case 3: return bergerak([-0.8, 1.3, 4.7], [-0.8, 1.3, 4.2], [-0.72, 1.45, 0.3], [-0.72, 1.45, 0.3], 28, 0.07);
    case 4: return bergerak([0.78, 1.45, 3.0], [0.78, 1.38, 2.72], [0.68, 0.98, 0.8], [0.68, 0.98, 0.8], 28, 0.05);
    case 5: return bergerak([-0.85, 1.72, 4.3], [-0.85, 1.72, 3.9], [-0.85, 1.72, 0], [-0.85, 1.72, 0], 26, 0.09);
    case 6: return S([0, 2.0, 10.2], [0, 1.72, 0.4], 28, 0.04);
    case 7: return bergerak([0, 1.6, 5.3], [0, 1.6, 4.9], [0, 1.14, 0.78], [0, 1.14, 0.78], 22, 0.03);
    case 8: return bergerak([-1.45, 1.6, 10.2], [-1.45, 1.6, 8.3], hadapRaka, hadapRaka, 27, 0.04, cepat);
    case 9: return bergerak([1.45, 1.6, 8.6], [1.45, 1.6, 8.3], hadapDina, hadapDina, 27, 0.04);
    case 10: return bergerak([-0.85, 1.7, 3.9], [-0.85, 1.7, 3.5], [-0.85, 1.72, 0], [-0.85, 1.72, 0], 26, 0.09);
    case 11: return S([0, 1.75, 9.6], [0, 1.72, 2.4], 26, 0.015);
    case 12: {
      const sudut = lerp(-0.42, 0.42, u);
      return { pos: [Math.sin(sudut) * 9.2, 2.15, 0.9 + Math.cos(sudut) * 9.2], target: [0, 1.32, 0.9], fov: 25, ap: 0.025 };
    }
    case 13: return bergerak([1.35, 1.6, 8.6], [1.45, 1.6, 8.3], hadapDina, hadapDina, 27, 0.04);
    case 14: return bergerak([-1.35, 1.6, 8.6], [-1.45, 1.6, 8.3], hadapRaka, hadapRaka, 27, 0.04);
    case 15: return bergerak([0, 1.9, 10.5], [0, 1.85, 8.6], [0, 1.45, 0.3], [0, 1.45, 0.3], 28, 0.05);
    case 16: return S([0, 2.0, 10.2], [0, 1.62, 0.4], 28, 0.04);
    case 17: return bergerak([-0.85, 1.55, 5.2], [-0.85, 1.55, 4.8], [-0.85, 1.5, 0], [-0.85, 1.5, 0], 26, 0.05);
    case 18: return bergerak([-0.3, 1.8, 6.0], [-0.42, 1.75, 5.5], [-0.42, 1.25, 0.3], [-0.42, 1.25, 0.3], 28, 0.035);
    case 19: return bergerak([-0.45, 1.75, 8], [-0.45, 1.72, 6.6], [-0.45, 1.45, 0.2], [-0.45, 1.45, 0.2], 28, 0.05);
    case 20: return bergerak([0.15, 1.95, 10.8], [0.15, 1.95, 10.2], [0.15, 1.45, 1.0], [0.15, 1.45, 1.0], 28, 0.025);
    default: return S([0, 2, 10], [0, 1.3, 0.5], 28, 0.03);
  }
}

export function buatCerita(naskah) {
  const kurvaRaka = naskah.simulasi.raka_30_persen.kurva_juta;
  const kurvaDina = naskah.simulasi.dina_2_persen.kurva_juta;

  let waktu = 0.15;
  const adegan = naskah.adegan.map((a) => {
    const kata = a.suara.split(/\s+/).length;
    const durasi = (a.durasi_detik ?? Math.max(1.4, kata / 2.5 + 0.5)) + (TAMBAHAN[a.id] || 0);
    const hasil = { ...a, mulai: waktu, durasi };
    waktu += durasi;
    return hasil;
  });
  const akhirCerita = waktu;
  const total = akhirCerita + DURASI_PENUTUP;

  const ke = (id) => adegan.find((a) => a.id === id);
  const a7 = ke(7);
  const a12 = ke(12);
  const langkah = [0];
  for (let i = 0; i < 4; i++) langkah.push(a7.mulai + 0.45 + (i * (a7.durasi - 1.0)) / 3);
  for (let i = 0; i < 6; i++) langkah.push(a12.mulai + 0.5 + (i * (a12.durasi - 1.0)) / 5);
  const rakaJumlah = kurvaRaka.map((v) => Math.round(v * 2));
  const dinaJumlah = kurvaDina.map((v) => Math.round(v * 2));

  function tradeKe(t) {
    let i = 0;
    while (i < 10 && langkah[i + 1] <= t) i++;
    return i;
  }

  function adeganPada(t) {
    let i = 0;
    while (i < adegan.length - 1 && adegan[i + 1].mulai <= t) i++;
    return adegan[i];
  }

  function terakhirNonArga(a) {
    const i = adegan.indexOf(a);
    for (let j = i; j >= 0; j--) if (adegan[j].pembicara !== 'arga') return adegan[j];
    return null;
  }

  function keadaan(t) {
    const a = adeganPada(t);
    const lokal = Math.max(0, t - a.mulai);
    const bicara = a.pembicara;

    const acuan = terakhirNonArga(a);
    const lokalBeku = bicara === 'arga' ? (acuan ? acuan.durasi : 0) : lokal;
    const rakaA = acuan && (acuan.pembicara === 'raka' || acuan.pembicara === 'dina') ? acuan : null;
    const beku = bicara === 'arga';

    const pakaiUntuk = (nama) => {
      if (!rakaA) return null;
      const daftar = [...adegan].filter((x) => x.mulai <= rakaA.mulai && x.pembicara === nama);
      return daftar.length ? daftar[daftar.length - 1] : null;
    };
    const aR = pakaiUntuk('raka');
    const aD = pakaiUntuk('dina');
    const lokalUntuk = (x) => (x === acuan ? lokalBeku : x ? x.durasi : 0);

    const raka = poseRaka(aR, lokalUntuk(aR));
    const dina = poseDina(aD, lokalUntuk(aD), beku ? 0 : t);
    if (a.id === 3 || a.id === 5) {
      dina.hy = -0.45;
      dina.gx = -0.6;
    }
    if (a.id === 4) {
      raka.hy = 0.42;
      raka.gx = 0.6;
    }
    if (bicara === 'raka' && (a.id === 8 || a.id === 10 || a.id === 14 || a.id === 17)) {
      dina.hy = -0.42;
      dina.gx = -0.6;
    }
    if (bicara === 'dina' && (a.id === 9 || a.id === 13)) {
      raka.hy = 0.42;
      raka.gx = 0.6;
    }
    if (!beku) {
      raka.muka.kedip = kedipan(t, 0);
      dina.muka.kedip = kedipan(t, 1.4);
      if (bicara === 'raka') raka.muka.buka = gerakBibir(lokal, a.durasi) * (a.id === 8 ? 1 : 0.7) + (a.id === 8 ? 0.4 : 0);
      if (bicara === 'dina') dina.muka.buka = gerakBibir(lokal, a.durasi) * 0.7;
      if (a.id === 5) raka.muka.buka = 0.75 + Math.sin(lokal * 15) * 0.2;
    } else if (a.id === 6 && raka.muka) {
      raka.muka.buka = 0.75;
    }

    let taruhanRaka = null;
    let taruhanDina = null;
    if (a.id >= 3 && a.id <= 6) {
      const dR = a.id === 3 ? halus(0.5, 1.2, lokal) : 1;
      taruhanRaka = dR * 0.34;
    }
    if (a.id >= 4 && a.id <= 6) {
      const dD = a.id === 4 ? halus(0.3, 0.9, lokal) : 1;
      taruhanDina = dD * 0.34;
    }

    let bar = [0, 0];
    if (a.id === 11) {
      const g = halus(1.1, 2.6, lokal);
      bar = [(316.5 / 100) * 3 * g, (8.4 / 100) * 3 * halus(1.1, 1.6, lokal)];
    }

    const engsel = a.id === 18 ? lerp(0.35, -1.5, halus(1.0, 1.5, lokal)) : (a.id > 18 ? -1.5 : 0.35);

    return {
      a,
      lokal,
      raka,
      dina,
      kamera: kamera(a, lokal),
      koin: { rakaJumlah, dinaJumlah, langkah, waktu: t, taruhanRaka, taruhanDina },
      trade: tradeKe(t),
      bar,
      engsel,
    };
  }

  return { adegan, total, akhirCerita, kurvaRaka, kurvaDina, keadaan, ke, DURASI_PENUTUP };
}
