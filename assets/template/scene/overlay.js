// Draws the 2D graphics listed under "overlays" in each scene of script.json.
export function drawOverlays({ ctx, textBox, wrapLines, project, pop, W, FONT, cast, HEAD_Y }, state) {
  const { scene, local } = state;
  for (const item of scene.overlays || []) {
    const age = local - (item.at || 0);
    if (age < 0) continue;
    const scale = pop(age / 0.4);
    const y = item.y ?? 400;

    if (item.type === 'label') {
      const member = cast[item.target];
      const [px, py] = project(member ? member.x : 0, HEAD_Y + 0.69, -0.05);
      ctx.globalAlpha = Math.min(1, age / 0.3);
      textBox([item.text], Math.min(W - 70, Math.max(70, px)), Math.max(265, py - 40), 30, item.color || '#ffffff');
      ctx.globalAlpha = 1;
    }

    if (item.type === 'card' || item.type === 'number') {
      const big = item.type === 'number';
      const lines = wrapLines(item.text || '', 26, 500);
      const height = (big ? 120 : 62) + lines.length * 34 + 28;
      ctx.save();
      ctx.translate(W / 2, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = 'rgba(16,20,34,.92)';
      ctx.beginPath();
      ctx.roundRect(-285, -height / 2, 570, height, 26);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = item.color || '#ffd27a';
      ctx.font = `800 ${big ? 92 : 40}px ${FONT}`;
      const headY = -height / 2 + (big ? 66 : 38);
      ctx.fillText(big ? item.value : item.title, 0, headY);
      ctx.fillStyle = '#d8deea';
      ctx.font = `600 26px ${FONT}`;
      lines.forEach((line, i) => ctx.fillText(line, 0, headY + (big ? 70 : 44) + i * 34));
      ctx.restore();
    }

    if (item.type === 'icons') {
      const gap = 680 / item.items.length;
      item.items.forEach((entry, i) => {
        const s = pop((age - i * (item.stagger ?? 0.8)) / 0.4);
        if (s <= 0) return;
        ctx.save();
        ctx.translate(20 + gap * (i + 0.5), y);
        ctx.scale(s, s);
        ctx.fillStyle = 'rgba(16,20,34,.92)';
        ctx.beginPath();
        ctx.roundRect(-gap / 2 + 8, -85, gap - 16, 170, 24);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = entry.color || '#ffd27a';
        ctx.font = `800 64px ${FONT}`;
        ctx.fillText(entry.icon, 0, -24);
        ctx.fillStyle = '#e8ecf5';
        ctx.font = `600 22px ${FONT}`;
        ctx.fillText(entry.label, 0, 48);
        ctx.restore();
      });
    }
  }
}
