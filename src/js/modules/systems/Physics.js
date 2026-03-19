import { CONFIG } from '../Config.js';
import { aabbIntersect, resolveAABB, clamp } from '../core/MathUtil.js';

export class Physics {
  constructor(platforms) {
    this.platforms = platforms; // [{x,y,w,h}]
  }

  integrate(ent, dt) {
    // gravity
    ent.vy += CONFIG.world.gravity * dt;
    // clamp velocities to avoid tunneling too much
    ent.vx = clamp(ent.vx, -1200, 1200);
    ent.vy = clamp(ent.vy, -2000, 2000);
    ent.x += ent.vx * dt;
    ent.y += ent.vy * dt;

    const bounds = { x: 0, y: 0, w: CONFIG.world.width, h: CONFIG.world.height };
    // world bounds
    if (ent.x < 0) { ent.x = 0; ent.vx = 0; }
    if (ent.x + ent.w > bounds.w) { ent.x = bounds.w - ent.w; ent.vx = 0; }
    if (ent.y + ent.h > bounds.h) { ent.y = bounds.h - ent.h; ent.vy = 0; ent.grounded = true; ent.jumpsLeft = (ent.jumpsLeft !== undefined) ? CONFIG.player.doubleJumpCount + 1 : ent.jumpsLeft; }

    // collisions with platforms
    ent.grounded = false;
    for (const p of this.platforms) {
      if (!aabbIntersect(ent.bbox(), p)) continue;
      const mtv = resolveAABB(ent.bbox(), p);
      ent.x += mtv.x;
      ent.y += mtv.y;
      if (mtv.y < 0) { // landed on top
        ent.vy = 0; ent.grounded = true; if (ent.jumpsLeft !== undefined) ent.jumpsLeft = CONFIG.player.doubleJumpCount + 1; }
      if (mtv.y > 0) { ent.vy = 0; }
      if (mtv.x !== 0) { ent.vx = 0; }
    }
  }
}

