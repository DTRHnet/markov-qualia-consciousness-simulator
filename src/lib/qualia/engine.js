// ─────────────────────────────────────────────────────────────────────
// QualiaEngine — owns the agents, the world, the kernel tick loop, the
// smooth render loop, coupling, and fusion.
// ─────────────────────────────────────────────────────────────────────

import {
  ARENA_W, ARENA_H, KERNEL_TICK_MS, COUPLE_RADIUS, FUSION_RADIUS,
  FUSION_SIM_THRESHOLD, FUSION_HOLD_TICKS, FUSION_DURATION_MS,
  NUM_AI_AGENTS, AGENT_RADIUS, MAX_SPEED, STATES, STATE_COLORS,
} from './constants';
import { stepQualia, cosineSim, argmax, normalize } from './kernels';
import { dist, clamp, lerp } from './math';
import { render } from './renderer';

let _id = 0;

function makeAgent(x, y, isPlayer, name) {
  const belief = new Array(6).fill(1 / 6);
  return {
    id: _id++, x, y, vx: 0, vy: 0, targetVel: { x: 0, y: 0 },
    belief, experience: argmax(belief),
    isPlayer, name, radius: AGENT_RADIUS, baseRadius: AGENT_RADIUS,
    particles: [], coupling: 0, lastMode: 'hold', couplingSignal: 0,
    absorbed: false, fused: false, fusionProgress: 0, fusionCandidate: null,
  };
}

function rand(a, b) { return a + Math.random() * (b - a); }
function randomBelief() {
  const v = new Array(6).fill(0).map(() => 0.2 + Math.random());
  return normalize(v);
}

export class QualiaEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.agents = [];
    this.world = {
      nodes: [
        { x: 300, y: 220 }, { x: 900, y: 300 }, { x: 600, y: 560 },
        { x: 250, y: 640 }, { x: 980, y: 640 },
      ],
    };
    this.fusions = [];            // { lead, absorbed, timer }
    this.player = null;
    this.playerInput = { x: 0, y: 0 };
    this.spectator = false;
    this.running = false;
    this.onTickCb = null;
    this.time = 0;
    this.fusionRequest = false;
    this.remotePlayers = [];
    this.initAgents();
  }

  initAgents() {
    this.player = makeAgent(ARENA_W / 2, ARENA_H / 2, true, 'You');
    this.agents.push(this.player);
    for (let i = 0; i < NUM_AI_AGENTS; i++) {
      const a = makeAgent(rand(80, ARENA_W - 80), rand(80, ARENA_H - 80), false, `Agent ${i + 1}`);
      a.belief = randomBelief();
      a.experience = argmax(a.belief);
      this.agents.push(a);
    }
  }

  onTick(cb) { this.onTickCb = cb; }
  setPlayerInput(x, y) { this.playerInput = { x, y }; }
  setSpectator(b) { this.spectator = b; if (b) this.playerInput = { x: 0, y: 0 }; }
  requestFusion() { this.fusionRequest = true; }

  // all bodies the kernel can perceive: local agents + remote humans
  allNeighbors() {
    return this.agents.concat(this.remotePlayers);
  }

  // merge synced human players in (interpolated toward their reported pos)
  setRemotePlayers(list) {
    const next = [];
    for (const r of list) {
      const existing = this.remotePlayers.find((p) => p.id === r.id);
      const base = existing || { id: r.id, x: r.x, y: r.y, particles: [] };
      base.x = existing ? existing.x : r.x;
      base.y = existing ? existing.y : r.y;
      base.targetX = r.x;
      base.targetY = r.y;
      base.belief = r.belief;
      base.experience = r.experience;
      base.name = r.name;
      base.isPlayer = false;
      base.isRemote = true;
      base.fused = false;
      base.absorbed = false;
      base.radius = 16;
      base.couplingSignal = 0;
      next.push(base);
    }
    this.remotePlayers = next;
  }

  start() {
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.loop);
    this.tickTimer = setTimeout(this.tickLoop, KERNEL_TICK_MS);
  }
  stop() { this.running = false; clearTimeout(this.tickTimer); }

  // smooth render + movement loop (every frame)
  loop = (t) => {
    if (!this.running) return;
    const dt = Math.min(40, t - this.last);
    this.last = t;
    this.time = t;
    this.updateMovement(dt);
    this.updateParticles(dt);
    render(this.ctx, this);
    requestAnimationFrame(this.loop);
  };

  // consciousness tick (every KERNEL_TICK_MS)
  tickLoop = () => {
    if (!this.running) return;
    this.kernelStep();
    if (this.onTickCb) this.onTickCb(this.snapshot());
    this.tickTimer = setTimeout(this.tickLoop, KERNEL_TICK_MS);
  };

  kernelStep() {
    // expire fusions
    for (const f of this.fusions) f.timer -= KERNEL_TICK_MS;
    for (const f of this.fusions.filter(f => f.timer <= 0)) this.splitFusion(f);
    this.fusions = this.fusions.filter(f => f.timer > 0);

    // step every non-absorbed agent's qualia kernel
    for (const a of this.agents) {
      if (a.absorbed) continue;
      if (a.isPlayer && !this.spectator) {
        // human: action chosen by keyboard, experience still emerges from P
        a.targetVel = { x: this.playerInput.x * MAX_SPEED, y: this.playerInput.y * MAX_SPEED };
        stepQualia(a, this.allNeighbors(), this.world, 'player');
      } else {
        stepQualia(a, this.allNeighbors(), this.world, null);
      }
      if (Math.random() < 0.9) this.spawnParticle(a);
    }

    this.updateFusionProgress();
    if (this.fusionRequest) { this.fusionRequest = false; this.tryPlayerFusion(); }
  }

  updateFusionProgress() {
    const free = this.agents.filter(a => !a.absorbed && !a.fused);

    // player progress toward a candidate
    if (this.player && !this.player.fused && !this.player.absorbed) {
      let best = null, bestSim = -1;
      for (const a of free) {
        if (a === this.player) continue;
        if (dist(this.player, a) < FUSION_RADIUS) {
          const s = cosineSim(this.player.belief, a.belief);
          if (s > bestSim) { bestSim = s; best = a; }
        }
      }
      if (best && bestSim >= FUSION_SIM_THRESHOLD)
        this.player.fusionProgress = Math.min(FUSION_HOLD_TICKS, this.player.fusionProgress + 1);
      else
        this.player.fusionProgress = Math.max(0, this.player.fusionProgress - 1);
      this.player.fusionCandidate = this.player.fusionProgress >= FUSION_HOLD_TICKS ? best : null;
    }

    // AI auto-fusion: two attuned AI agents may merge on their own
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        const a = free[i], b = free[j];
        if (a.isPlayer || b.isPlayer) continue;
        if (dist(a, b) < FUSION_RADIUS && cosineSim(a.belief, b.belief) >= FUSION_SIM_THRESHOLD) {
          if (Math.random() < 0.03 && this.fusions.length < 2) this.fuse(a, b);
        }
      }
    }
  }

  tryPlayerFusion() {
    if (!this.player || this.player.fused || this.player.absorbed) return;
    const cand = this.player.fusionCandidate;
    if (!cand) return;
    this.fuse(this.player, cand);
    this.player.fusionProgress = 0;
    this.player.fusionCandidate = null;
  }

  fuse(a, b) {
    if (this.fusions.length >= 2) return;
    const lead = a;
    const absorbed = b;
    lead.fused = true; absorbed.fused = true; absorbed.absorbed = true;
    lead.baseRadius = lead.radius;
    lead.radius = AGENT_RADIUS * 1.8;
    lead.belief = normalize(lead.belief.map((v, i) => (v + absorbed.belief[i]) / 2));
    lead.experience = argmax(lead.belief);
    this.fusions.push({ lead, absorbed, timer: FUSION_DURATION_MS });
  }

  splitFusion(f) {
    const { lead, absorbed } = f;
    lead.fused = false;
    lead.radius = lead.baseRadius || AGENT_RADIUS;
    absorbed.fused = false;
    absorbed.absorbed = false;
    const ang = Math.random() * Math.PI * 2;
    absorbed.x = clamp(lead.x + Math.cos(ang) * 40, 30, ARENA_W - 30);
    absorbed.y = clamp(lead.y + Math.sin(ang) * 40, 30, ARENA_H - 30);
    absorbed.belief = normalize(absorbed.belief.map(v => v + (Math.random() - 0.5) * 0.1));
    absorbed.experience = argmax(absorbed.belief);
  }

  updateMovement(dt) {
    const f = dt / 16.67;
    for (const a of this.agents) {
      if (a.absorbed) {
        const fu = this.fusions.find(x => x.absorbed === a);
        if (fu) { a.x = fu.lead.x; a.y = fu.lead.y; }
        continue;
      }
      a.vx = lerp(a.vx, a.targetVel.x, 0.06);
      a.vy = lerp(a.vy, a.targetVel.y, 0.06);
      a.x = clamp(a.x + a.vx * f, a.radius, ARENA_W - a.radius);
      a.y = clamp(a.y + a.vy * f, a.radius, ARENA_H - a.radius);
      a.couplingSignal = Math.max(0, a.couplingSignal - 0.1);
    }
    for (const p of this.remotePlayers) {
      p.x = lerp(p.x, p.targetX ?? p.x, 0.12);
      p.y = lerp(p.y, p.targetY ?? p.y, 0.12);
    }
  }

  spawnParticle(a) {
    const col = STATE_COLORS[a.experience];
    const ang = Math.random() * Math.PI * 2;
    const sp = 0.3 + Math.random() * 0.7;
    a.particles.push({ x: a.x, y: a.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, col });
    if (a.particles.length > 14) a.particles.shift();
  }

  updateParticles(dt) {
    const f = dt / 16.67;
    for (const a of this.agents) {
      for (const p of a.particles) { p.x += p.vx * f; p.y += p.vy * f; p.life -= 0.02 * f; }
      a.particles = a.particles.filter(p => p.life > 0);
    }
  }

  snapshot() {
    return {
      spectator: this.spectator,
      player: this.player ? {
        name: this.player.name,
        x: this.player.x,
        y: this.player.y,
        experience: STATES[this.player.experience],
        experienceIdx: this.player.experience,
        belief: [...this.player.belief],
        fused: this.player.fused,
        fusionProgress: this.player.fusionProgress,
        fusionReady: !!this.player.fusionCandidate,
        fusionCandidateName: this.player.fusionCandidate ? this.player.fusionCandidate.name : null,
      } : null,
      agents: [
        ...this.agents.filter(a => !a.absorbed).map(a => ({
          id: a.id, name: a.name, experience: STATES[a.experience],
          experienceIdx: a.experience, isPlayer: a.isPlayer, isRemote: false,
          fused: a.fused, belief: [...a.belief],
        })),
        ...this.remotePlayers.map(a => ({
          id: a.id, name: a.name, experience: STATES[a.experience],
          experienceIdx: a.experience, isPlayer: false, isRemote: true,
          fused: false, belief: [...a.belief],
        })),
      ],
      activeFusions: this.fusions.length,
    };
  }
}