/**
 * Таймеры оборудования, движение/столкновения снарядов, запуск активных модулей.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { BIOMES } from '../data/biomes.js';
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { Particle } from '../entities/effects.js';

export class EquipmentSystem {
    updateAllModules(dt) {
        this.drill.droneOrbitAngle += dt * 3.2;
        if (this.drill.bastionWaveCooldown > 0) {
            this.drill.bastionWaveCooldown = Math.max(0, this.drill.bastionWaveCooldown - dt);
        }
        if (this.drill.chronoBuffTimer > 0) {
            this.drill.chronoBuffTimer = Math.max(0, this.drill.chronoBuffTimer - dt);
        }
        if (this.drill.cryoSlowTimer > 0) {
            this.drill.cryoSlowTimer = Math.max(0, this.drill.cryoSlowTimer - dt);
        }

        const curBiome = BIOMES[this.currentBiomeIndex] || BIOMES[0];
        const cdrHaste = this.drill.getCooldownHasteMultiplier() + (curBiome.cdrBiomeBonus || 0);

        this.drill.modules.forEach((m) => {
            if (this.state !== 'PLAYING') return;
            const spec = MODULES_CATALOG[m.id];
            if (!spec || !spec.isActiveTimer) return;

            if (m.id === 'TITAN_SHIELD') {
                if (!this.drill.shieldReady) {
                    m.timer -= dt * cdrHaste;
                    if (m.timer <= 0) {
                        this.drill.shieldReady = true;
                        m.timer = 0;
                        this.spawnFloatingText(this.drill.visualX, this.drill.visualY - 0.4, 'ЩИТ ГОТОВ', '#818cf8', false);
                    }
                }
                return;
            }

            m.timer -= dt * cdrHaste;
            if (m.timer <= 0) {
                const cd = spec.cooldowns[m.level - 1];
                m.timer = cd;
                this.triggerActiveModule(m.id, m.level);
            }
        });

        // Обновление бронебойных снарядов «Вулкана» и рикошетящих пил «Жнеца»
        const ts = CONFIG.TILE_SIZE;
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (this.state !== 'PLAYING') break;
            const p = this.projectiles[i];
            p.update(dt);
            const gx = Math.floor(p.x / ts);
            const gy = Math.floor(p.y / ts);

            if (gy < 1 || gy >= CONFIG.LAYER_ROWS - 2) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Рикошет дисковой пилы от боковых стен шахты
            if (p.type === 'saw' && (gx <= 0 || gx >= CONFIG.GRID_COLS - 1)) {
                if (p.bouncesLeft > 0) {
                    p.bouncesLeft--;
                    p.vx = -p.vx;
                    p.x = Math.max(ts * 1.1, Math.min((CONFIG.GRID_COLS - 1.1) * ts, p.x));
                    p.y += ts * 0.35; // Смещается чуть ниже при каждом рикошете!
                    this.sound.playDrillHit(1.5, false);
                    this.spawnParticles( Math.max(1, Math.min(CONFIG.GRID_COLS - 2, gx)), gy, '#2dd4bf', 6, 95);
                } else {
                    this.projectiles.splice(i, 1);
                }
                continue;
            }

            if (gx > 0 && gx < CONFIG.GRID_COLS - 1) {
                const tile = this.grid[gy] && this.grid[gy][gx];
                const hitKey = `${gx},${gy}`;
                if (tile && !tile.isEmpty() && !tile.proto.indestructible && p.lastHitKey !== hitKey) {
                    p.lastHitKey = hitKey;
                    let dmg = p.damage;
                    if (this.drill.hasSynergy('CRYO_SHATTER') && p.type === 'saw') dmg *= 1.6;
                    if (this.drill.hasSynergy('THERMAL_OVERDRIVE')) dmg *= 1.25;
                    tile.hp -= dmg;
                    this.spawnParticles(gx, gy, p.type === 'saw' ? '#2dd4bf' : '#fde047', 5, 85);
                    if (tile.hp <= 0) {
                        this.destroyBlock(gx, gy, true);
                    }
                    if (p.type === 'shell') {
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }
            }

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }

        // Обновление полета самонаводящихся ракет
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            if (this.state !== 'PLAYING') break;
            const r = this.rockets[i];
            r.smokeTimer -= dt;
            if (r.smokeTimer <= 0) {
                r.smokeTimer = 0.035;
                if (this.particles.length < (this.canvas?.width <= 640 ? 250 : 600)) {
                    this.particles.push(new Particle(r.x, r.y, (Math.random() - 0.5) * 20, -15, '#94a3b8', 3, 0.25, -20));
                }
            }
            const hit = r.update(dt);
            if (hit) {
                this.detonateRocket(r.targetGridX, r.targetGridY);
                this.rockets.splice(i, 1);
            }
        }

        // Обновление прыгающих сейсмо-бомб
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            if (this.state !== 'PLAYING') break;
            const b = this.bombs[i];
            b.update(dt);
            const gx = Math.max(1, Math.min(CONFIG.GRID_COLS - 2, Math.floor(b.x / CONFIG.TILE_SIZE)));
            const gy = Math.max(1, Math.min(CONFIG.LAYER_ROWS - 3, Math.floor(b.y / CONFIG.TILE_SIZE)));
            const tile = this.grid[gy] && this.grid[gy][gx];

            if (tile && !tile.isEmpty() && !tile.proto.indestructible) {
                this.detonateBomb(gx, gy);
                if (b.bouncesLeft > 0) {
                    b.bouncesLeft--;
                    b.vy = -150;
                    b.vx = (Math.random() - 0.5) * 130;
                } else {
                    this.bombs.splice(i, 1);
                }
            } else if (b.life <= 0) {
                this.detonateBomb(gx, gy);
                this.bombs.splice(i, 1);
            }
        }
    }

    triggerActiveModule(modId, level) {
        if (this.drill.hasSynergy('THERMAL_OVERDRIVE')) {
            this.drill.addHeat(3.5);
        }
        if (modId === 'ROCKET_POD') {
            const count = MODULES_CATALOG.ROCKET_POD.missilesCount[level - 1];
            this.fireRocketSalvo(count);
        } else if (modId === 'TESLA_COIL') {
            const targets = MODULES_CATALOG.TESLA_COIL.targetsCount[level - 1];
            this.fireTeslaLightning(targets);
        } else if (modId === 'SIDE_LASERS') {
            const range = MODULES_CATALOG.SIDE_LASERS.pierceRange[level - 1];
            this.fireSideLasers(range);
        } else if (modId === 'SEISMO_MORTAR') {
            const count = MODULES_CATALOG.SEISMO_MORTAR.bombsCount[level - 1];
            this.fireSeismoMortar(count);
        } else if (modId === 'MINING_DRONE') {
            const count = MODULES_CATALOG.MINING_DRONE.droneCount[level - 1];
            this.fireMiningDrones(count, level);
        } else if (modId === 'FROST_NOVA') {
            this.fireFrostNova(level);
        } else if (modId === 'SAW_BLADES') {
            this.fireSawBlades(level);
        } else if (modId === 'PLASMA_ANNIHILATOR') {
            this.firePlasmaAnnihilator(level);
        } else if (modId === 'GRAV_SINGULARITY') {
            this.fireGravSingularity(level);
        } else if (modId === 'OMEGA_CONVERTER') {
            this.fireOmegaConverter(level);
        }
    }
}
