/**
 * Движение снарядов; столкновения обрабатывает система оборудования.
 */
import { CONFIG } from '../data/config.js';

export class HomingRocket {
    constructor(x, y, vx, vy, targetGridX, targetGridY) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.targetX = (targetGridX + 0.5) * CONFIG.TILE_SIZE;
        this.targetY = (targetGridY + 0.5) * CONFIG.TILE_SIZE;
        this.targetGridX = targetGridX;
        this.targetGridY = targetGridY;
        this.life = 1.4;
        this.smokeTimer = 0;
    }

    update(dt) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const desiredVx = (dx / dist) * 340;
        const desiredVy = (dy / dist) * 340;

        this.vx += (desiredVx - this.vx) * Math.min(1, dt * 11);
        this.vy += (desiredVy - this.vy) * Math.min(1, dt * 11);

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        return dist < 14 || this.life <= 0;
    }
}

export class ClusterBomb {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.bouncesLeft = 1;
        this.life = 1.3;
    }

    update(dt) {
        this.vy += 420 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }
}

export class KineticProjectile {
    constructor(x, y, vx, vy, type = 'shell', bounces = 0, damage = 55) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type; // 'shell' или 'saw'
        this.bouncesLeft = bounces;
        this.damage = damage;
        this.life = type === 'saw' ? 2.2 : 0.95;
        this.angle = 0;
        this.lastHitKey = '';
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += dt * 22;
        this.life -= dt;
    }
}
