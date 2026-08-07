// Canvas renderer — draws the field of conscious agents.
import { ARENA_W, ARENA_H, STATE_COLORS, COUPLE_RADIUS } from './constants';
import { dist } from './math';
import { cosineSim } from './kernels';

export function render(ctx, engine) {
  const { agents, world, time } = engine;

  // background — deep, slightly mysterious space
  const bg = ctx.createRadialGradient(ARENA_W / 2, ARENA_H / 2, 50, ARENA_W / 2, ARENA_H / 2, 720);
  bg.addColorStop(0, '#0c0c1a');
  bg.addColorStop(1, '#050509');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);

  // subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= ARENA_W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_H); ctx.stroke(); }
  for (let y = 0; y <= ARENA_H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ARENA_W, y); ctx.stroke(); }

  // arena border
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, ARENA_W, ARENA_H);

  // world energy nodes
  for (const n of world.nodes) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.002 + n.x);
    const g = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, 45 + pulse * 10);
    g.addColorStop(0, 'rgba(180,160,255,0.5)');
    g.addColorStop(1, 'rgba(180,160,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(n.x, n.y, 55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,210,255,0.9)';
    ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, Math.PI * 2); ctx.fill();
  }

  // coupling lines between nearby agents
  const live = [...agents, ...engine.remotePlayers].filter(a => !a.absorbed);
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      const d = dist(a, b);
      if (d < COUPLE_RADIUS) {
        const w = 1 - d / COUPLE_RADIUS;
        const sim = cosineSim(a.belief, b.belief);
        const alpha = w * 0.5 * (0.4 + sim * 0.6);
        const ca = STATE_COLORS[a.experience], cb = STATE_COLORS[b.experience];
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `rgba(${ca[0]},${ca[1]},${ca[2]},${alpha})`);
        grad.addColorStop(1, `rgba(${cb[0]},${cb[1]},${cb[2]},${alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + sim * 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }

  // agents
  for (const a of live) drawAgent(ctx, a, time);
}

function drawAgent(ctx, a, time) {
  const [r, g, b] = STATE_COLORS[a.experience];

  // particles
  for (const p of a.particles) {
    ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${p.life * 0.5})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + p.life * 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // soft aura
  const auraR = a.radius * 3.2;
  const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.4, a.x, a.y, auraR);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(a.x, a.y, auraR, 0, Math.PI * 2); ctx.fill();

  // probability ring — the "qualia flower": 6 segments, radial extent = belief[i]
  for (let i = 0; i < 6; i++) {
    const c = STATE_COLORS[i];
    const a0 = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
    const rr = a.radius + 5 + a.belief[i] * 16;
    ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.9)`;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(a.x, a.y, rr, a0, a1); ctx.stroke();
  }

  // body
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2); ctx.fill();
  // inner highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(a.x - a.radius * 0.3, a.y - a.radius * 0.3, a.radius * 0.3, 0, Math.PI * 2); ctx.fill();

  // fused pulse ring
  if (a.fused) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.radius + 10 + pulse * 4, 0, Math.PI * 2); ctx.stroke();
  }

  // player ring
  if (a.isPlayer) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.radius + 3, 0, Math.PI * 2); ctx.stroke();
  }
  // remote human ring (dashed — a real other player, not local AI)
  if (a.isRemote) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(a.x, a.y, a.radius + 3, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  // fusion-ready hint
  if (a.isPlayer && a.fusionCandidate) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 12px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('F', a.x, a.y - a.radius - 20);
  }

  // label
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '11px ui-sans-serif, system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(a.name, a.x, a.y + a.radius + 16);
}