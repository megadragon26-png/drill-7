/**
 * Ракеты, молнии, лазеры, мортира, дроны и крио-импульс.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { TILE_TYPES } from '../data/tiles.js';
import { BlockTile } from '../entities/block-tile.js';
import { HomingRocket, ClusterBomb } from '../entities/projectiles.js';

export class Weapons {
    fireRocketSalvo(count) {
        const candidates = [];
        for (let dy = -1; dy <= 5; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const tx = this.drill.gridX + dx;
                const ty = this.drill.gridY + dy;
                if (tx > 0 && tx < CONFIG.GRID_COLS - 1 && ty > 2 && ty < CONFIG.LAYER_ROWS - 2) {
                    const t = this.grid[ty][tx];
                    if (t && !t.isEmpty() && !t.proto.indestructible) {
                        const priority = (t.proto.oreValue || t.proto.fuelGain || t.proto.hazard) ? 3 : 1;
                        candidates.push({ tx, ty, priority: priority + Math.random() });
                    }
                }
            }
        }
        if (!candidates.length) return;
        candidates.sort((a, b) => b.priority - a.priority);

        this.sound.playRocketLaunch();
        const startX = (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE;
        const startY = (this.drill.visualY + 0.5) * CONFIG.TILE_SIZE;

        for (let i = 0; i < Math.min(count, candidates.length); i++) {
            const target = candidates[i];
            const spreadVx = (i % 2 === 0 ? -1 : 1) * (120 + i * 45);
            const spreadVy = -140 - i * 25;
            this.rockets.push(new HomingRocket(startX, startY, spreadVx, spreadVy, target.tx, target.ty));
        }
    }

    detonateRocket(gx, gy) {
        this.sound.playHazardExplosion();
        this.screenShake = Math.max(this.screenShake, 0.16);
        this.shockwaveRings.push({
            x: (gx + 0.5) * CONFIG.TILE_SIZE,
            y: (gy + 0.5) * CONFIG.TILE_SIZE,
            radius: 6,
            maxRadius: CONFIG.TILE_SIZE * 1.65,
            color: '251, 146, 60',
            life: 0.32,
            maxLife: 0.32
        });
        this.spawnParticles(gx, gy, '#f97316', 18, 165);
        this.spawnParticles(gx, gy, '#fde047', 12, 120);

        // Объёмный заряд добавляет внешнее кольцо, сохраняя урон исходного взрыва.
        const radius = this.drill.hasModifier('ROCKET_PAYLOAD') ? 2 : 1;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = gx + dx;
                const ny = gy + dy;
                if (nx > 0 && nx < CONFIG.GRID_COLS - 1 && ny > 0 && ny < CONFIG.LAYER_ROWS - 2) {
                    const tile = this.grid[ny][nx];
                    if (tile && !tile.isEmpty() && !tile.proto.indestructible) {
                        if (dx === 0 && dy === 0) {
                            this.destroyBlock(nx, ny, true);
                        } else {
                            tile.hp -= Math.max(Math.abs(dx), Math.abs(dy)) === 2 ? 30 : 55;
                            if (tile.hp <= 0) this.destroyBlock(nx, ny, true);
                        }
                    }
                }
            }
        }
    }

    fireTeslaLightning(maxTargets) {
        const targets = [];
        for (let dy = -2; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const tx = this.drill.gridX + dx;
                const ty = this.drill.gridY + dy;
                if (tx > 0 && tx < CONFIG.GRID_COLS - 1 && ty > 1 && ty < CONFIG.LAYER_ROWS - 2) {
                    const t = this.grid[ty][tx];
                    if (t && !t.isEmpty() && !t.proto.indestructible) {
                        const score = (t.proto.oreValue ? 4 : 1) + (t.proto.hazard === 'gas' ? 5 : 0) + Math.random();
                        targets.push({ tx, ty, score });
                    }
                }
            }
        }
        if (!targets.length) return;
        targets.sort((a, b) => b.score - a.score);

        this.sound.playTeslaZap();
        let prevX = (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE;
        let prevY = (this.drill.visualY + 0.5) * CONFIG.TILE_SIZE;

        const chosen = targets.slice(0, maxTargets);
        chosen.forEach((item) => {
            const nextX = (item.tx + 0.5) * CONFIG.TILE_SIZE;
            const nextY = (item.ty + 0.5) * CONFIG.TILE_SIZE;
            this.lightningArcs.push({ x1: prevX, y1: prevY, x2: nextX, y2: nextY, life: 0.22 });
            prevX = nextX;
            prevY = nextY;

            const tile = this.grid[item.ty][item.tx];
            if (tile && !tile.isEmpty()) {
                this.spawnParticles(item.tx, item.ty, '#38bdf8', 8, 110);
                tile.hp -= 75;
                if (tile.hp <= 0) {
                    this.destroyBlock(item.tx, item.ty, true);
                }
            }
        });
    }

    fireSideLasers(pierceRange) {
        const y = this.drill.gridY;
        let fired = false;
        [-1, 1].forEach((dir) => {
            for (let step = 1; step <= pierceRange; step++) {
                const tx = this.drill.gridX + dir * step;
                if (tx > 0 && tx < CONFIG.GRID_COLS - 1) {
                    const target = this.grid[y][tx];
                    if (target && !target.isEmpty() && !target.proto.indestructible) {
                        fired = true;
                        this.laserBeams.push({
                            x1: (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE,
                            y1: (this.drill.visualY + 0.5) * CONFIG.TILE_SIZE,
                            x2: (tx + 0.5) * CONFIG.TILE_SIZE,
                            y2: (y + 0.5) * CONFIG.TILE_SIZE,
                            color: '#f43f5e',
                            life: 0.20
                        });
                        this.spawnParticles(tx, y, '#fb7185', 7, 90);
                        this.destroyBlock(tx, y, true);
                    }
                }
            }
        });
        if (fired) this.sound.playLaserPulse();
    }

    fireSeismoMortar(count) {
        const sx = (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE;
        const sy = (this.drill.visualY + 0.6) * CONFIG.TILE_SIZE;
        this.sound.playRocketLaunch();
        for (let i = 0; i < count; i++) {
            const vx = (i - (count - 1) / 2) * 90;
            const vy = 85 + i * 25;
            this.bombs.push(new ClusterBomb(sx, sy, vx, vy));
        }
    }

    detonateBomb(gx, gy) {
        this.sound.playHazardExplosion();
        this.shockwaveRings.push({
            x: (gx + 0.5) * CONFIG.TILE_SIZE,
            y: (gy + 0.5) * CONFIG.TILE_SIZE,
            radius: 5,
            maxRadius: CONFIG.TILE_SIZE * 1.4,
            color: '250, 204, 21',
            life: 0.26,
            maxLife: 0.26
        });
        this.spawnParticles(gx, gy, '#facc15', 14, 140);
        this.destroyBlock(gx, gy, true);
        if (gy + 1 < CONFIG.LAYER_ROWS - 2) {
            const below = this.grid[gy + 1][gx];
            if (below && !below.isEmpty() && !below.proto.indestructible) {
                below.hp -= 65;
                if (below.hp <= 0) this.destroyBlock(gx, gy + 1, true);
            }
        }
    }

    fireMiningDrones(droneCount, level) {
        const candidates = [];
        for (let dy = -2; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const tx = this.drill.gridX + dx;
                const ty = this.drill.gridY + dy;
                if (tx > 0 && tx < CONFIG.GRID_COLS - 1 && ty > 1 && ty < CONFIG.LAYER_ROWS - 2) {
                    const t = this.grid[ty][tx];
                    if (t && !t.isEmpty() && !t.proto.indestructible) {
                        const val = (t.proto.isTechPod ? 10 : 0) + (t.proto.hullGain ? 8 : 0) + (t.proto.oreValue ? 6 : 0) + (t.proto.fuelGain ? 5 : 1);
                        candidates.push({ tx, ty, val: val + Math.random() });
                    }
                }
            }
        }
        if (!candidates.length) return;
        candidates.sort((a, b) => b.val - a.val);

        const ts = CONFIG.TILE_SIZE;
        for (let d = 0; d < Math.min(droneCount, candidates.length); d++) {
            const angle = this.drill.droneOrbitAngle + d * Math.PI;
            const droneX = (this.drill.visualX + 0.5) * ts + Math.cos(angle) * 28;
            const droneY = (this.drill.visualY + 0.5) * ts + Math.sin(angle) * 22;
            const target = candidates[d];

            this.laserBeams.push({
                x1: droneX,
                y1: droneY,
                x2: (target.tx + 0.5) * ts,
                y2: (target.ty + 0.5) * ts,
                color: '#34d399',
                life: 0.16
            });

            const tile = this.grid[target.ty][target.tx];
            if (tile && !tile.isEmpty()) {
                tile.hp -= (level >= 3 ? 85 : 52);
                this.spawnParticles(target.tx, target.ty, '#34d399', 5, 70);
                if (tile.hp <= 0) {
                    this.destroyBlock(target.tx, target.ty, true);
                }
            }
        }
    }

    fireFrostNova(level) {
        const coolAmount = MODULES_CATALOG.FROST_NOVA.heatClear[level - 1];
        this.drill.addHeat(-coolAmount);
        this.sound.playLaserPulse();

        const cx = (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE;
        const cy = (this.drill.visualY + 0.5) * CONFIG.TILE_SIZE;
        this.shockwaveRings.push({
            x: cx,
            y: cy,
            radius: 8,
            maxRadius: CONFIG.TILE_SIZE * 2.8,
            color: '56, 189, 248',
            life: 0.45,
            maxLife: 0.45
        });

        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const tx = this.drill.gridX + dx;
                const ty = this.drill.gridY + dy;
                if (tx > 0 && tx < CONFIG.GRID_COLS - 1 && ty > 1 && ty < CONFIG.LAYER_ROWS - 2) {
                    const t = this.grid[ty][tx];
                    if (!t || t.isEmpty() || t.proto.indestructible) continue;

                    // Превращаем опасную Лаву в ценный Обсидиан (+28 Руды)!
                    if (t.proto.hazard === 'lava') {
                        this.grid[ty][tx] = new BlockTile(tx, ty, TILE_TYPES.OBSIDIAN);
                        this.spawnParticles(tx, ty, '#38bdf8', 12, 95);
                        this.spawnFloatingText(tx, ty, 'ЛАВА -> ОБСИДИАН!', '#7dd3fc', true);
                    } else {
                        t.frozen = true;
                        t.hp -= (22 + level * 14);
                        if (t.hp <= 0) this.destroyBlock(tx, ty, true);
                    }
                }
            }
        }
    }
}
