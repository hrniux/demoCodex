export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sign = (v) => (v === 0 ? 0 : v > 0 ? 1 : -1);
export const now = () => performance.now() / 1000;

export function aabbIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function resolveAABB(mover, solid) {
  // Returns minimal translation vector to push mover out of solid
  const dx1 = solid.x + solid.w - mover.x; // from left
  const dx2 = mover.x + mover.w - solid.x; // from right
  const dy1 = solid.y + solid.h - mover.y; // from top
  const dy2 = mover.y + mover.h - solid.y; // from bottom
  const tx = Math.min(dx1, dx2);
  const ty = Math.min(dy1, dy2);
  if (tx < ty) {
    const dir = dx1 < dx2 ? 1 : -1;
    return { x: dir * tx, y: 0 };
  } else {
    const dir = dy1 < dy2 ? 1 : -1;
    return { x: 0, y: dir * ty };
  }
}

