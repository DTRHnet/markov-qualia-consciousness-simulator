// ─────────────────────────────────────────────────────────────────────
// Qualia Flow — global constants
// The agent's conscious experience lives in a tiny 6-state space.
// ─────────────────────────────────────────────────────────────────────

export const STATES = ['Calm', 'Curious', 'Alert', 'Excited', 'Anxious', 'Focused'];

// RGB color for each conscious state (used for auras, bodies, UI).
export const STATE_COLORS = [
  [120, 200, 220], // Calm    — cyan
  [170, 220, 140], // Curious — green
  [240, 200, 120], // Alert   — amber
  [240, 140, 180], // Excited — pink
  [190, 130, 240], // Anxious — violet
  [120, 160, 240], // Focused — blue
];

export const STATE_BLURBS = {
  Calm: 'Low arousal, low coupling — the agent rests in itself.',
  Curious: 'Open, seeking — pulled toward others and world nodes.',
  Alert: 'Heightened attention — the field feels crowded.',
  Excited: 'High arousal — energy nodes and neighbours light it up.',
  Anxious: 'Withdrawn — too many agents, too close.',
  Focused: 'Locked-on — moving with intent toward a target.',
};

// Shared 2D arena (top-down).
export const ARENA_W = 1200;
export const ARENA_H = 800;

// One tick of consciousness runs every KERNEL_TICK_MS.
export const KERNEL_TICK_MS = 500;

// Coupling: how close two agents must be to leak experience into each other.
export const COUPLE_RADIUS = 150;

// Fusion: closeness + similarity sustained long enough lets two agents merge.
export const FUSION_RADIUS = 78;
export const FUSION_SIM_THRESHOLD = 0.86;   // cosine similarity of belief vectors
export const FUSION_HOLD_TICKS = 6;          // sustained ticks required
export const FUSION_DURATION_MS = 12000;    // how long a fusion lasts

export const NUM_AI_AGENTS = 7;              // + you = 8 agents in the field
export const AGENT_RADIUS = 16;
export const MAX_SPEED = 2.6;