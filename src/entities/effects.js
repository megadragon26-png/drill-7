/**
 * Короткоживущие визуальные эффекты.
 */
export class Particle {
    constructor(x, y, vx, vy, color, size, life, gravity = 180) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.gravity = gravity;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.life -= dt;
    }
}

export class FloatingText {
    constructor(x, y, text, color, isBig = false) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.isBig = isBig;
        this.life = isBig ? 1.35 : 1.05;
        this.maxLife = this.life;
    }

    update(dt) {
        this.y -= (this.isBig ? 24 : 30) * dt;
        this.life -= dt;
    }
}
