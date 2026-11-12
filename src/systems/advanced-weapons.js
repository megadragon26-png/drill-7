/**
 * Бастион, Вулкан, Жнец, Омега, плазма и гравитационное оружие.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { TILE_TYPES } from '../data/tiles.js';
import { BlockTile } from '../entities/block-tile.js';
import { KineticProjectile } from '../entities/projectiles.js';

export class AdvancedWeapons {
    triggerBastionCounterWave() {
        const bastionLvl = this.drill.getModuleLevel('BLAST_ARMOR');
        if (bastionLvl <= 0) return;
        const hasFortressSyn = this.drill.hasSynergy('FORTRESS_RETALIATION');
        const radius = hasFortressSyn ? 2 : 1;
        const ts = CONFIG.TILE_SIZE;

        this.shockwaveRings.push({
            x: (this.drill.visualX + 0.5) * ts,
            y: (this.drill.visualY + 0.5) * ts,
            radius: 8,
            maxRadius: ts * (hasFortressSyn ? 2.6 : 1.8),
            color: '16, 185, 129',
            life: 0.4,
            maxLife: 0.4
        });

        let destroyed = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = this.drill.gridX + dx;
                const ny = this.drill.gridY + dy;
                if (nx > 0 && nx < CONFIG.GRID_COLS - 1 && ny > 1 && ny < CONFIG.LAYER_ROWS - 2) {
                    const t = this.grid[ny][nx];
                    if (this.state === 'PLAYING' && t && !t.isEmpty() && !t.proto.indestructible && !t.proto.isTechPod && !t.proto.isStructureConsole) {
                        t.hp -= (65 + bastionLvl * 25);
                        if (t.hp <= 0) {
                            if (bastionLvl >= 2 && !t.proto.oreValue) {
                                this.drill.addOre(5);
                            }
                            this.destroyBlock(nx, ny, true);
                            if (this.grid[ny][nx].isEmpty()) destroyed++;
                        }
                    }
                }
            }
        }
        if (hasFortressSyn && destroyed > 0) this.drill.tryRepairHull(Math.min(4, destroyed));
        this.spawnFloatingText(this.drill.visualX, this.drill.visualY - 0.6, 'ОТВЕТНЫЙ ИМПУЛЬС БАСТИОНА!', '#34d399', true);
    }

    fireOreGatlingVolley(level) {
        if (this.projectiles.length > 24) return;
        let count = MODULES_CATALOG.ORE_GATLING.shellsCount[level - 1];
        if (this.drill.hasSynergy('ORE_BARRAGE')) count += 2;

        const sx = (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE;
        const sy = (this.drill.visualY + 0.7) * CONFIG.TILE_SIZE;
        for (let i = 0; i < count; i++) {
            const spreadAngle = ((i - (count - 1) / 2) / Math.max(1, count)) * 0.95;
            const speed = 390;
            const vx = Math.sin(spreadAngle) * speed;
            const vy = Math.cos(spreadAngle) * speed;
            this.projectiles.push(new KineticProjectile(sx, sy, vx, vy, 'shell', 0, 52 + level * 16));
        }
    }

    fireSawBlades(level) {
        const bounces = MODULES_CATALOG.SAW_BLADES.bounces[level - 1] + (this.drill.hasModifier('SAW_TEETH') ? 2 : 0);
        const sx = (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE;
        const sy = (this.drill.visualY + 0.5) * CONFIG.TILE_SIZE;
        this.sound.playDrillHit(1.8, false);

        [-1, 1].forEach((dir) => {
            this.projectiles.push(new KineticProjectile(
                sx + dir * 10,
                sy,
                dir * 320,
                0,
                'saw',
                bounces,
                58 + level * 20
            ));
        });
    }

    fireOmegaConverter(level) {
        const count = MODULES_CATALOG.OMEGA_CONVERTER.transmuteCount[level - 1];
        const candidates = [];
        for (let dy = -1; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = this.drill.gridX + dx;
                const ny = this.drill.gridY + dy;
                if (nx > 0 && nx < CONFIG.GRID_COLS - 1 && ny > 2 && ny < CONFIG.LAYER_ROWS - 3) {
                    const t = this.grid[ny][nx];
                    if (t && !t.isEmpty() && !t.proto.indestructible && !t.proto.isTechPod && !t.proto.isStructureConsole && !t.proto.isSupplyCrate && !t.proto.oreValue && !t.proto.fuelGain && !t.proto.hullGain) {
                        candidates.push({ nx, ny, priority: t.proto.hazard ? 3 : 1 });
                    }
                }
            }
        }
        if (!candidates.length) return;
        candidates.sort((a, b) => (b.priority + Math.random()) - (a.priority + Math.random()));

        const ts = CONFIG.TILE_SIZE;
        const sx = (this.drill.visualX + 0.5) * ts;
        const sy = (this.drill.visualY + 0.5) * ts;
        this.sound.playBlockBreak(true);

        const chosen = candidates.slice(0, count);
        chosen.forEach(({ nx, ny }, idx) => {
            const roll = Math.random();
            let newProto = TILE_TYPES.ORE_QUARTZ;
            if (roll < 0.25) newProto = TILE_TYPES.ORE_VITALIUM;
            else if (roll < 0.52) newProto = TILE_TYPES.OIL_VEIN;
            else if (roll < 0.80) newProto = level >= 3 ? TILE_TYPES.ORE_TITANITE : TILE_TYPES.ORE_AMETHYST;

            this.grid[ny][nx] = new BlockTile(nx, ny, newProto, 0.8);
            this.spawnParticles(nx, ny, '#fde047', 12, 115);

            this.laserBeams.push({
                x1: sx,
                y1: sy,
                x2: (nx + 0.5) * ts,
                y2: (ny + 0.5) * ts,
                color: '#fde047',
                life: 0.30
            });

            if (level >= 2 && idx === 0) {
                this.destroyBlock(nx, ny, true);
            }
        });
        this.spawnFloatingText(this.drill.visualX, this.drill.visualY - 0.5, 'АЛХИМИЯ МИДАСА!', '#fde047', true);
    }

    firePlasmaAnnihilator(level) {
        const depth = MODULES_CATALOG.PLASMA_ANNIHILATOR.beamDepth[level - 1];
        const gx = this.drill.gridX;
        const startY = this.drill.gridY + 1;
        const ts = CONFIG.TILE_SIZE;

        this.sound.playLaserPulse();
        this.screenShake = Math.max(this.screenShake, 0.22);

        const beamX = (this.drill.visualX + 0.5) * ts;
        const beamTopY = (this.drill.visualY + 0.8) * ts;
        const beamBotY = Math.min(CONFIG.LAYER_ROWS - 3, startY + depth) * ts;

        this.laserBeams.push({
            x1: beamX,
            y1: beamTopY,
            x2: beamX,
            y2: beamBotY,
            color: '#fde047',
            life: 0.35
        });

        for (let step = 0; step < depth; step++) {
            const ty = startY + step;
            if (ty >= CONFIG.LAYER_ROWS - 2) break;
            const colsToHit = level >= 3 ? [gx - 1, gx, gx + 1] : [gx];
            colsToHit.forEach((cx) => {
                if (cx <= 0 || cx >= CONFIG.GRID_COLS - 1) return;
                const t = this.grid[ty][cx];
                if (t && !t.isEmpty() && !t.proto.indestructible && !t.proto.isTechPod) {
                    this.spawnParticles(cx, ty, '#fde047', 8, 130);
                    if (cx === gx) {
                        if (level >= 2 && t.proto.oreValue) {
                            this.drill.addOre(Math.round(t.proto.oreValue * 0.25));
                        }
                        this.destroyBlock(cx, ty, true);
                    } else {
                        t.hp -= 85;
                        if (t.hp <= 0) this.destroyBlock(cx, ty, true);
                    }
                }
            });
        }
    }

    fireGravSingularity(level) {
        const gx = this.drill.gridX;
        const gy = Math.min(CONFIG.LAYER_ROWS - 4, this.drill.gridY + 2);
        const ts = CONFIG.TILE_SIZE;

        this.sound.playTeslaZap();
        this.screenShake = Math.max(this.screenShake, 0.24);

        this.shockwaveRings.push({
            x: (gx + 0.5) * ts,
            y: (gy + 0.5) * ts,
            radius: ts * 2.4,
            maxRadius: 6, // Схлопывающееся гравитационное кольцо!
            color: '192, 132, 252',
            life: 0.45,
            maxLife: 0.45
        });

        let destroyed = 0;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = gx + dx;
                const ny = gy + dy;
                if (nx > 0 && nx < CONFIG.GRID_COLS - 1 && ny > 2 && ny < CONFIG.LAYER_ROWS - 2) {
                    const tile = this.grid[ny][nx];
                    if (this.state === 'PLAYING' && tile && !tile.isEmpty() && !tile.proto.indestructible && !tile.proto.isTechPod && !tile.proto.isStructureConsole) {
                        this.spawnParticles(nx, ny, '#c084fc', 5, 95);
                        tile.hp -= (75 + level * 28);
                        if (tile.hp <= 0) {
                            this.destroyBlock(nx, ny, true);
                            if (this.grid[ny][nx].isEmpty()) destroyed++;
                        }
                    }
                }
            }
        }
        if (level >= 2 && destroyed > 0) this.drill.addFuel(Math.min(level >= 3 ? 12 : 8, destroyed * 2));
    }
}
