// ─────────────────────────────────────────────────────────────────────
// THE MARKOV QUALIA KERNEL — D, A, P, Q
//
// Every agent runs this exact composition every tick:
//
//      Q  =  P ∘ A ∘ D
//
//   D  decision kernel    : current experience  -> action probabilities
//   A  action             : sampled action      -> moves the body
//   P  perception kernel  : world + neighbours   -> new experience dist
//   Q  composed qualia    : blend belief toward perception (Markov memory)
//
// The agent never perceives the world "as it is". It perceives a
// constructed experience, and that experience drives the next action.
// ─────────────────────────────────────────────────────────────────────

import { COUPLE_RADIUS, MAX_SPEED } from './constants';
import { dist, norm } from './math';

// ─── D · Decision Kernel ────────────────────────────────────────────
// D[experience] = probability distribution over ACTION-MODES.
// A conscious state does not deterministically cause behaviour — it
// biases a distribution, and the agent SAMPLES from it.
//
// Action-modes: 0 hold · 1 drift · 2 seek · 3 flee · 4 wander · 5 interact
export const ACTION_MODES = ['hold', 'drift', 'seek', 'flee', 'wander', 'interact'];

export const D = [
  /* Calm     */ [0.45, 0.35, 0.05, 0.02, 0.10, 0.03],
  /* Curious  */ [0.10, 0.20, 0.45, 0.05, 0.15, 0.05],
  /* Alert    */ [0.25, 0.10, 0.10, 0.40, 0.10, 0.05],
  /* Excited  */ [0.05, 0.10, 0.30, 0.05, 0.35, 0.15],
  /* Anxious  */ [0.10, 0.05, 0.05, 0.65, 0.10, 0.05],
  /* Focused  */ [0.30, 0.10, 0.40, 0.05, 0.05, 0.10],
];

// ─── helpers ─────────────────────────────────────────────────────────
export function sample(dist) {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < dist.length; i++) {
    acc += dist[i];
    if (r <= acc) return i;
  }
  return dist.length - 1;
}

export function normalize(v) {
  const s = v.reduce((p, c) => p + c, 0) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= s;
  return v;
}

export function argmax(v) {
  let m = 0;
  for (let i = 1; i < v.length; i++) if (v[i] > v[m]) m = i;
  return m;
}

export function cosineSim(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return d / (Math.sqrt(na * nb) || 1);
}

// ─── A · Action ──────────────────────────────────────────────────────
// A applies a sampled action-mode to the agent's body (sets a target
// velocity). 'seek'/'flee' are computed relative to the nearest neighbour.
export function applyAction(agent, mode, neighbors) {
  const nearest = nearestOther(agent, neighbors);
  let dir = { x: 0, y: 0 };
  switch (mode) {
    case 'hold':     dir = { x: 0, y: 0 }; break;
    case 'drift':    dir = randVec(0.45); break;
    case 'seek':     dir = nearest ? norm(nearest.x - agent.x, nearest.y - agent.y) : randVec(0.3); break;
    case 'flee':     dir = nearest ? norm(agent.x - nearest.x, agent.y - nearest.y) : randVec(0.3); break;
    case 'wander':   dir = randVec(1); break;
    case 'interact': dir = nearest ? norm(nearest.x - agent.x, nearest.y - agent.y) : randVec(0.3); agent.couplingSignal = 1; break;
    default: dir = { x: 0, y: 0 };
  }
  agent.targetVel = { x: dir.x * MAX_SPEED, y: dir.y * MAX_SPEED };
  agent.lastMode = mode;
}

function nearestOther(agent, neighbors) {
  let best = null, bd = Infinity;
  for (const n of neighbors) {
    if (n === agent || n.absorbed) continue;
    const d = dist(agent, n);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

function randVec(s) {
  const a = Math.random() * Math.PI * 2;
  return { x: Math.cos(a) * s, y: Math.sin(a) * s };
}

// ─── P · Perception Kernel ───────────────────────────────────────────
// P maps the WORLD (body + nearby agents + world features) into a NEW
// EXPERIENCE DISTRIBUTION. This is where qualia are constructed.
//
// The social mechanic: nearby agents' experience distributions LEAK INTO
// yours, weighted by proximity. This is COUPLING — your feelings are
// literally shaped by the feelings of those around you.
export function perceptionVector(agent, neighbors, world) {
  const v = new Array(6).fill(0);

  // (1) Markov inertia: the next experience depends on the current one.
  for (let i = 0; i < 6; i++) v[i] += 0.5 * agent.belief[i];

  // (2) Coupling — neighbours' qualia bleed in by closeness.
  let crowd = 0, couplingStrength = 0;
  for (const n of neighbors) {
    if (n === agent || n.absorbed) continue;
    const d = dist(agent, n);
    if (d < COUPLE_RADIUS) {
      const w = (1 - d / COUPLE_RADIUS) * 0.6;
      for (let i = 0; i < 6; i++) v[i] += w * n.belief[i];
      couplingStrength += w;
      crowd++;
    }
  }
  agent.coupling = couplingStrength;

  // (3) World energy nodes pull toward Excited / Curious.
  for (const node of world.nodes) {
    const d = dist(agent, node);
    if (d < 220) { const w = (1 - d / 220) * 0.25; v[3] += w; v[1] += w * 0.6; }
  }

  // (4) Crowding -> Anxious / Alert; isolation -> Calm.
  if (crowd >= 3) { v[4] += 0.4; v[2] += 0.3; }
  if (crowd === 0) v[0] += 0.3;

  return normalize(v);
}

// ─── Q · Composed Qualia Kernel  (Q = P ∘ A ∘ D) ─────────────────────
// One tick of consciousness:
//   1. sample an action-mode from D[experience]      (D)
//   2. apply that action to the world                (A)
//   3. perceive the resulting world into a new dist   (P)
//   4. blend belief toward perception (Markov memory) (Q composition)
//   5. new conscious experience = argmax(belief)
//
// If actionOverride is given (the human player), steps 1–2 are skipped —
// the player chooses their action, but their experience still EMERGES
// from perception. You control what you do; you do not control what you feel.
export function stepQualia(agent, neighbors, world, actionOverride) {
  if (!actionOverride) {
    const modeIdx = sample(D[agent.experience]);      // (D)
    applyAction(agent, ACTION_MODES[modeIdx], neighbors); // (A)
  } else {
    agent.lastMode = actionOverride; // 'player' — targetVel already set by input
  }
  const perc = perceptionVector(agent, neighbors, world); // (P)
  const alpha = 0.35;
  for (let i = 0; i < 6; i++) agent.belief[i] = (1 - alpha) * agent.belief[i] + alpha * perc[i]; // (Q)
  normalize(agent.belief);
  agent.experience = argmax(agent.belief);
}