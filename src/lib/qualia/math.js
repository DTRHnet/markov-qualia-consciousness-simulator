// Small math helpers shared by the kernel and renderer.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function norm(x, y) {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}