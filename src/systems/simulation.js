/**
 * Один шаг симуляции: расход ресурсов, движение, бурение, физика, события и HUD.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { BIOMES } from '../data/biomes.js';
import { CONFIG } from '../data/config.js';
import { TILE_TYPES } from '../data/tiles.js';
import { BlockTile } from '../entities/block-tile.js';
import { getLayerFuelDrain } from '../data/economy.js';

export class Simulation {
    updateUnstableRocks(dt) {
        const hasGasFilter = this.drill.hasModule('GAS_FILTER');

        for (let y = CONFIG.LAYER_ROWS - 3; y >= 1; y--) {
            for (let x = 1; x < CONFIG.GRID_COLS - 1; x++) {
                const tile = this.grid[y][x];
                if (!tile || tile.isEmpty()) continue;

                // Динамическое нагнетание давления в Газовых карманах рядом с буром
                if (tile.proto.hazard === 'gas') {
                    const dist = Math.hypot(x - this.drill.gridX, y - this.drill.gridY);
                    if (dist <= 1.85 && !hasGasFilter) {
                        tile.pressureTimer += dt;
                        if (tile.pressureTimer >= CONFIG.GAS_PRESSURE_LIMIT) {
                            // Самопроизвольный взрыв газа под давлением!
                            this.destroyBlock(x, y, false, 'environment');
                            continue;
                        }
                    } else {
                        tile.pressureTimer = Math.max(0, tile.pressureTimer - dt * 1.4);
                    }
                }

                if (!tile.proto.fallingHazard) continue;

                const below = this.grid[y + 1][x];
                const isDrillDirectlyUnder = (this.drill.gridX === x && this.drill.gridY === y + 1);

                if (below && below.isEmpty() && !isDrillDirectlyUnder) {
                    if (!tile.isWobbling) {
                        tile.isWobbling = true;
                        tile.wobbleTimer = 0.55;
                    } else {
                        tile.wobbleTimer -= dt;
                        if (tile.wobbleTimer <= 0) {
                            this.grid[y + 1][x] = tile;
                            tile.gridY = y + 1;
                            tile.wobbleTimer = 0.12;
                            this.grid[y][x] = new BlockTile(x, y, TILE_TYPES.EMPTY);

                            if (this.drill.gridX === x && this.drill.gridY === y + 2) {
                                this.sound.playHazardExplosion();
                                const dmg = this.drill.takeDamage(tile.proto.damage, 'rock');
                                this.destroyBlock(x, y + 1, true, 'environment');
                                if (dmg > 0) {
                                    this.spawnFloatingText(x, y + 1, `ОБВАЛ! -${dmg} HP`, '#f87171', true);
                                }
                                this.triggerDamageFeedback(
                                    x, y + 1, dmg,
                                    'Сверху упал тяжелый Валун!',
                                    'Когда треснувший камень дрожит над вами — уходите вбок!',
                                    'rock'
                                );
                            }
                        }
                    }
                } else {
                    tile.isWobbling = false;
                }
            }
        }
    }

    update(dt) {
        for (let i = this.shockwaveRings.length - 1; i >= 0; i--) {
            const r = this.shockwaveRings[i];
            r.life -= dt;
            r.radius += (r.maxRadius - r.radius) * Math.min(1, dt * 11);
            if (r.life <= 0) this.shockwaveRings.splice(i, 1);
        }

        if (this.damageFlashTimer > 0) this.damageFlashTimer = Math.max(0, this.damageFlashTimer - dt);
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt);

        if (this.state === 'FATAL_SEQUENCE') {
            this.fatalSequenceTimer -= dt;
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update(dt);
                if (this.particles[i].life <= 0) this.particles.splice(i, 1);
            }
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                this.floatingTexts[i].update(dt);
                if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
            }
            if (this.fatalSequenceTimer <= 0) {
                this.openDeathModal();
            }
            return;
        }

        if (this.state !== 'PLAYING') return;
        this.drill.updateDriveTimers(dt);

        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= dt;
            return;
        }

        const biome = BIOMES[this.currentBiomeIndex];
        // ПОСЕКУНДНЫЙ РАСХОД ТОПЛИВА НА УРОВНЕ (растет с каждым слоем для высокого напряжения!)
        const layerTimeFuelDrain = getLayerFuelDrain(this.currentLayerNumber) * this.drill.getFuelConsumptionMultiplier();
        this.drill.consumeFuel(layerTimeFuelDrain * dt, this);
        if (biome.ambientHeatRate > 0) {
            this.drill.addHeat(biome.ambientHeatRate * dt);
        }

        this.drill.isDrilling = false;

        const belowY = Math.min(CONFIG.LAYER_ROWS - 1, this.drill.gridY + 1);
        const tileBelow = this.grid[belowY][this.drill.gridX];

        if (tileBelow && tileBelow.proto.isStation) {
            this.sound.playStationDock();
            this.openStationModal();
            return;
        }

        const stationBanner = document.getElementById('station-proximity-banner');
        const stationBannerText = document.getElementById('station-proximity-text');
        const blocksToExit = (CONFIG.LAYER_ROWS - 2) - this.drill.gridY;
        if (blocksToExit <= 8) {
            stationBanner.classList.remove('hidden');
            stationBanner.className = 'pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-lg bg-cyan-950/95 border-2 border-cyan-400 shadow-2xl text-center';
            stationBannerText.className = 'text-xs font-extrabold text-cyan-200 animate-pulse';
            stationBannerText.textContent = 'ВНИЗУ ГЕРМОШЛЮЗ ПОДЗЕМНОЙ СТАНЦИИ — ЗАЕЗЖАЙТЕ В ВОРОТА В ЦЕНТРЕ!';
        } else if (blocksToExit <= 24) {
            stationBanner.classList.remove('hidden');
            stationBanner.className = 'pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500/80 shadow-xl text-center';
            stationBannerText.className = 'text-[11px] font-extrabold text-rose-200';
            stationBannerText.textContent = `КРИТИЧЕСКАЯ ГЛУБИНА (до выхода ${blocksToExit} м): высокая плотность угроз!`;
        } else {
            stationBanner.classList.add('hidden');
        }

        // ШАГ 1: Сначала завершаем горизонтальный переезд бура в целевую колонку gridX,
        // чтобы при шаге вбок над пропастью бур НЕ летел по диагонали сквозь блок под собой!
        const dxSlide = this.drill.gridX - this.drill.visualX;
        if (Math.abs(dxSlide) > 0.03) {
            const slideStep = Math.sign(dxSlide) * CONFIG.SLIDE_SPEED * dt;
            if (Math.abs(slideStep) >= Math.abs(dxSlide)) {
                this.drill.visualX = this.drill.gridX;
            } else {
                this.drill.visualX += slideStep;
            }
            // Держим вертикаль ровно по ряду, пока машина переезжает в соседнюю колонку
            this.drill.visualY += (this.drill.gridY - this.drill.visualY) * Math.min(1, dt * 18);
        } else {
            this.drill.visualX = this.drill.gridX;

            // ШАГ 2: Если бур только что пробурил блок прямо под собой (visualY < gridY), плавно доводим вниз
            if (this.drill.visualY < this.drill.gridY - 0.02) {
                this.drill.visualY = Math.min(this.drill.gridY, this.drill.visualY + CONFIG.GRAVITY_SPEED * 1.25 * dt);
            } else if (tileBelow && tileBelow.isEmpty()) {
                // ШАГ 3: Строго вертикальное падение вниз по пустой колонке
                this.drill.facing = 'down';
                this.drill.visualY += CONFIG.GRAVITY_SPEED * dt;
                if (this.drill.visualY >= this.drill.gridY + 1) {
                    this.drill.gridY += 1;
                    this.drill.visualY = this.drill.gridY;
                }
            } else {
                // ШАГ 4: Бур твердо стоит на опоре в своей колонке — принимаем управление и бурение
                this.drill.visualY = this.drill.gridY;
                this.drill.moveTimer -= dt;

                let targetX = this.drill.gridX;
                let targetY = this.drill.gridY;
                let hasInput = false;

                if (this.keys.down) {
                    targetY += 1;
                    this.drill.facing = 'down';
                    hasInput = true;
                } else if (this.keys.left) {
                    targetX -= 1;
                    this.drill.facing = 'left';
                    hasInput = true;
                } else if (this.keys.right) {
                    targetX += 1;
                    this.drill.facing = 'right';
                    hasInput = true;
                }

                if (hasInput && targetX >= 0 && targetX < CONFIG.GRID_COLS && targetY < CONFIG.LAYER_ROWS) {
                    const targetTile = this.grid[targetY][targetX];

                    if (targetTile.isEmpty() || targetTile.proto.isStation) {
                        if (this.drill.moveTimer <= 0) {
                            this.drill.gridX = targetX;
                            this.drill.gridY = targetY;
                            this.drill.moveTimer = CONFIG.MOVE_COOLDOWN;
                        }
                    } else if (!targetTile.proto.indestructible) {
                        this.drill.isDrilling = true;
                        this.drill.drillAnimPhase += dt * 36;

                        const power = this.drill.getEffectiveDrillPower();
                        targetTile.hp -= power * dt;

                        if (targetTile.proto.heatGen > 0) {
                            this.drill.addHeat(targetTile.proto.heatGen * dt);
                        }

                        this.sound.playDrillHit(targetTile.proto.fuelCost, this.drill.isOverheated());

                        if (Math.random() < 0.65) {
                            this.spawnParticles(targetX, targetY, targetTile.proto.color || '#cbd5e1', 1, 75);
                        }

                        if (targetTile.hp <= 0) {
                            this.destroyBlock(targetX, targetY, false);
                            if (this.state === 'PLAYING') {
                                this.drill.gridX = targetX;
                                this.drill.gridY = targetY;
                                this.drill.moveTimer = CONFIG.MOVE_COOLDOWN;
                            }
                        }
                    }
                }
            }
        }

        if (!this.drill.isDrilling) {
            this.drill.addHeat(-CONFIG.PASSIVE_COOL_RATE * dt);
        }

        const overheatBanner = document.getElementById('overheat-banner');
        if (this.drill.isOverheated()) {
            overheatBanner.classList.remove('hidden');
        } else {
            overheatBanner.classList.add('hidden');
        }

        this.updateAllModules(dt);
        if (this.state === 'PLAYING') {
            this.updateWorldThreats(dt);
        }
        if (this.state === 'PLAYING') {
            this.updateUnstableRocks(dt);
            this.hazardDirector.update(dt);

            // Проверка приближения к уникальным подземным постройкам и локациям
            if (this.grid.landmarks) {
                this.grid.landmarks.forEach((lm) => {
                    if (!lm.discovered && Math.abs(this.drill.gridY - lm.y) <= 3.5) {
                        lm.discovered = true;
                        this.sound.playBlockBreak(true);
                        this.spawnFloatingText(lm.x, lm.y - 0.8, lm.title, lm.color, true);
                    }
                });
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.laserBeams.length - 1; i >= 0; i--) {
            this.laserBeams[i].life -= dt;
            if (this.laserBeams[i].life <= 0) this.laserBeams.splice(i, 1);
        }

        for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
            this.lightningArcs[i].life -= dt;
            if (this.lightningArcs[i].life <= 0) this.lightningArcs.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update(dt);
            if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
        }

        // Плавное следование камеры за буром по вертикали (с учетом мобильного масштаба viewScale)
        const viewScale = Math.min(1, this.canvas.width / (CONFIG.GRID_COLS * CONFIG.TILE_SIZE));
        const virtualViewH = this.canvas.height / viewScale;
        const targetCamY = this.drill.visualY * CONFIG.TILE_SIZE - virtualViewH * 0.36;
        const maxCamY = Math.max(0, CONFIG.LAYER_ROWS * CONFIG.TILE_SIZE - virtualViewH);
        const clampedCamY = Math.max(0, Math.min(maxCamY, targetCamY));
        this.cameraY += (clampedCamY - this.cameraY) * Math.min(1, dt * 10);

        // Проверка окончания топлива
        if (this.drill.fuel <= 0 && this.state === 'PLAYING') {
            this.drill.fuel = 0;
            this.startFatalSequence('fuel', this.drill.gridX, this.drill.gridY);
        }

        this.updateHUD(dt);
    }
}
