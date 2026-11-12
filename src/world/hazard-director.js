/**
 * Планирование, симуляция и отрисовка событий недр.
 */
import { BIOMES } from '../data/biomes.js';
import { CONFIG } from '../data/config.js';
import { TILE_TYPES } from '../data/tiles.js';
import { BlockTile } from '../entities/block-tile.js';

export class TectonicHazardDirector {
    constructor(game) {
        this.game = game;
        this.timer = 11.0;
        this.positiveTimer = 14.0;
        this.activeEvents = [];
        this.fallingDebris = [];
        this.fallingCrystals = [];
        this.plasmaBeams = [];
    }

    reset(biomeIndex) {
        const biome = BIOMES[Math.min(biomeIndex, BIOMES.length - 1)];
        const [minT, maxT] = biome.hazardInterval || [12.0, 16.0];
        this.timer = (minT + Math.random() * (maxT - minT)) * 0.65;
        this.positiveTimer = 11.0 + Math.random() * 5.0;
        this.activeEvents = [];
        this.fallingDebris = [];
        this.fallingCrystals = [];
        this.plasmaBeams = [];
        const banner = document.getElementById('tectonic-warning-banner');
        if (banner) banner.classList.add('hidden');
        const posBanner = document.getElementById('positive-event-banner');
        if (posBanner) posBanner.classList.add('hidden');
    }

    scheduleNext() {
        const biome = BIOMES[Math.min(this.game.currentBiomeIndex, BIOMES.length - 1)];
        const [minT, maxT] = biome.hazardInterval || [12.0, 16.0];
        // Чем глубже мы опустились на текущем слое, тем чаще происходят катаклизмы (до -40% интервала у самого выхода)
        const depthRatio = this.game.drill
            ? Math.max(0, Math.min(1, this.game.drill.gridY / Math.max(1, CONFIG.LAYER_ROWS)))
            : 0;
        const depthSpeedup = Math.max(0.58, 1.05 - depthRatio * 0.45);
        this.timer = Math.max(3.2, (minT + Math.random() * (maxT - minT)) * depthSpeedup * 0.65);
    }

    showPositiveBanner(title, desc) {
        const banner = document.getElementById('positive-event-banner');
        if (!banner) return;
        document.getElementById('positive-event-title').textContent = title;
        document.getElementById('positive-event-desc').textContent = desc;
        banner.classList.remove('hidden');
        this.game.sound.playStationDock();
        if (this.posTimeout) clearTimeout(this.posTimeout);
        this.posTimeout = setTimeout(() => banner.classList.add('hidden'), 3400);
    }

    spawnPositiveEvent() {
        const drill = this.game.drill;
        if (!drill || drill.gridY < 5 || drill.gridY > CONFIG.LAYER_ROWS - 6) {
            this.positiveTimer = 14.0;
            return;
        }

        const hasTier1 = this.game.meta.hasProject('POS_EVENTS_I');
        const hasTier2 = this.game.meta.hasProject('POS_EVENTS_II');

        // Список доступных позитивных событий (базовое + открываемые через Метапрогрессию)
        const availableEvents = ['THERMAL_UPDRAFT'];
        if (hasTier1) {
            availableEvents.push('FUEL_GEYSER', 'CRYSTAL_RAIN', 'FUEL_GEYSER');
        }
        if (hasTier2) {
            availableEvents.push('ORBITAL_DROP', 'ALCHEMY_WAVE', 'ORBITAL_DROP');
        }

        const picked = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        const ts = CONFIG.TILE_SIZE;

        if (picked === 'THERMAL_UPDRAFT') {
            // Базовое позитивное событие: Попутный Гео-Импульс (охлаждение + подзарядка топлива)
            drill.addFuel(16);
            drill.addHeat(-35);
            this.game.shockwaveRings.push({
                x: (drill.visualX + 0.5) * ts,
                y: (drill.visualY + 0.5) * ts,
                radius: 8,
                maxRadius: ts * 2.4,
                color: '52, 211, 153',
                life: 0.5,
                maxLife: 0.5
            });
            this.game.spawnParticles(drill.gridX, drill.gridY, '#34d399', 16, 120);
            this.game.spawnFloatingText(drill.visualX, drill.visualY - 0.6, 'ГЕО-ПОТОК: +16 ТОПЛ / -ЖАР!', '#34d399', true);
            this.showPositiveBanner(
                'БЛАГОДАТНОЕ СОБЫТИЕ: КРИО-ГЕОТЕРМАЛЬНЫЙ ПОТОК!',
                'Реактор охлажден (-35% Жара) и конденсировал +16 Топлива!'
            );
        } else if (picked === 'FUEL_GEYSER') {
            // Позитивное событие I: Энергетический Гейзер Изобилия
            drill.addFuel(24);
            drill.tryRepairHull(6);
            let spawnedBlocks = 0;
            for (let dy = 0; dy <= 3; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    if (spawnedBlocks >= 3) break;
                    const gx = drill.gridX + dx;
                    const gy = drill.gridY + dy;
                    if (gx > 1 && gx < CONFIG.GRID_COLS - 2 && gy > 3 && gy < CONFIG.LAYER_ROWS - 4) {
                        const t = this.game.grid[gy][gx];
                        if (t && !t.isEmpty() && !t.proto.isTechPod && !t.proto.isStructureConsole && !t.proto.indestructible && Math.random() < 0.35) {
                            this.game.grid[gy][gx] = new BlockTile(gx, gy, spawnedBlocks === 0 ? TILE_TYPES.ENERGY_BLOCK : TILE_TYPES.OIL_VEIN);
                            this.game.spawnParticles(gx, gy, '#10b981', 12, 110);
                            spawnedBlocks++;
                        }
                    }
                }
            }
            this.game.spawnFloatingText(drill.visualX, drill.visualY - 0.6, 'ЭНЕРГО-ГЕЙЗЕР: +24 ТОПЛ, ДО +6 HP!', '#10b981', true);
            this.showPositiveBanner(
                'БЛАГОДАТНАЯ АНОМАЛИЯ: ЭНЕРГО-ГЕЙЗЕР ИЗОБИЛИЯ!',
                'Восстановлено +24 Топлива и до 6 Жизней; вокруг появились энергожилы.'
            );
        } else if (picked === 'CRYSTAL_RAIN') {
            // Позитивное событие I: Золотой Кристаллопад (сверху падают самоцветы, дающие руду и топливо!)
            const count = 4;
            for (let i = 0; i < count; i++) {
                const col = Math.max(2, Math.min(CONFIG.GRID_COLS - 3, drill.gridX + (i - 1)));
                this.fallingCrystals.push({
                    col,
                    y: Math.max(1, drill.gridY - 5 - i * 0.6) * ts,
                    vy: 190,
                    oreReward: 22 + this.game.currentLayerNumber * 6,
                    fuelReward: 8,
                    life: 3.2
                });
            }
            this.showPositiveBanner(
                'БЛАГОДАТНОЕ СОБЫТИЕ: ЗОЛОТОЙ КРИСТАЛЛОПАД!',
                'Свод пещеры осыпается самоцветами — ловите зеленые кристаллы или собирайте их внизу!'
            );
        } else if (picked === 'ORBITAL_DROP') {
            // Позитивное событие II: Орбитальный Сброс Снабжения
            const dropX = Math.max(2, Math.min(CONFIG.GRID_COLS - 3, drill.gridX + (Math.random() < 0.5 ? -1 : 1)));
            const dropY = Math.min(CONFIG.LAYER_ROWS - 5, drill.gridY + 2);
            const dropProto = Math.random() < 0.55 ? TILE_TYPES.CHRONO_SPHERE : TILE_TYPES.TECH_POD;
            this.game.grid[dropY][dropX] = new BlockTile(dropX, dropY, dropProto);
            this.game.laserBeams.push({
                x1: (dropX + 0.5) * ts,
                y1: Math.max(0, dropY - 8) * ts,
                x2: (dropX + 0.5) * ts,
                y2: (dropY + 0.5) * ts,
                color: '#34d399',
                life: 0.55
            });
            this.game.spawnParticles(dropX, dropY, '#38bdf8', 22, 150);
            this.game.spawnFloatingText(dropX, dropY - 0.5, 'СБРОС С ОРБИТЫ!', '#38bdf8', true);
            this.showPositiveBanner(
                'ПОДДЕРЖКА С ОРБИТЫ: ДОСТАВЛЕНА КАПСУЛА!',
                'Луч снабжения телепортировал под вами ценный контейнер!'
            );
        } else if (picked === 'ALCHEMY_WAVE') {
            // Позитивное событие II: Алхимическое Сияние (превращает ловушки и камни вокруг в самоцветы и Виталиум)
            drill.chronoBuffTimer = Math.max(drill.chronoBuffTimer, 5.0);
            for (let dy = -1; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const gx = drill.gridX + dx;
                    const gy = drill.gridY + dy;
                    if (gx > 1 && gx < CONFIG.GRID_COLS - 2 && gy > 3 && gy < CONFIG.LAYER_ROWS - 4) {
                        const t = this.game.grid[gy][gx];
                        if (t && !t.isEmpty() && !t.proto.isTechPod && !t.proto.isStructureConsole && !t.proto.indestructible && Math.random() < 0.55) {
                            const newProto = Math.random() < 0.12 ? TILE_TYPES.ORE_VITALIUM : TILE_TYPES.ORE_AMETHYST;
                            this.game.grid[gy][gx] = new BlockTile(gx, gy, newProto);
                            this.game.spawnParticles(gx, gy, '#fde047', 10, 100);
                        }
                    }
                }
            }
            this.game.spawnFloatingText(drill.visualX, drill.visualY - 0.6, 'АЛХИМИЧЕСКОЕ СИЯНИЕ + ХРОНО 5С!', '#fde047', true);
            this.showPositiveBanner(
                'БЛАГОДАТНАЯ АНОМАЛИЯ: АЛХИМИЧЕСКОЕ СИЯНИЕ!',
                'Порода вокруг превратилась в Аметисты и Виталиум, а расход топлива остановлен на 5 сек!'
            );
        }

        this.positiveTimer = (hasTier1 || hasTier2) ? (14.0 + Math.random() * 6.0) : (20.0 + Math.random() * 6.0);
    }

    showWarning(title, desc) {
        const banner = document.getElementById('tectonic-warning-banner');
        if (!banner) return;
        document.getElementById('tectonic-warning-title').textContent = title;
        document.getElementById('tectonic-warning-desc').textContent = desc;
        banner.classList.remove('hidden');
        this.game.sound.playTectonicAlarm();
        if (this.warnTimeout) clearTimeout(this.warnTimeout);
        this.warnTimeout = setTimeout(() => banner.classList.add('hidden'), 3000);
    }

    spawnRandomEvent() {
        const drill = this.game.drill;
        if (!drill || drill.gridY < 6 || drill.gridY > CONFIG.LAYER_ROWS - 6) {
            this.scheduleNext();
            return;
        }

        // В нижней части уровня (ближе к станции) катаклизмы масштабнее!
        const depthRatio = drill.gridY / Math.max(1, CONFIG.LAYER_ROWS);
        const isDeepZone = depthRatio >= 0.65;

        const roll = Math.random();
        if (roll < 0.36) {
            // 1. ИЗВЕРЖЕНИЕ ЛАВЫ (в глубокой зоне перед выходом 3-4 клетки вместо 2-3)
            const cells = [];
            const count = (isDeepZone ? 3 : 2) + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                const gx = Math.max(1, Math.min(CONFIG.GRID_COLS - 2, drill.gridX + Math.floor((Math.random() - 0.5) * 4)));
                const gy = Math.max(4, Math.min(CONFIG.LAYER_ROWS - 4, drill.gridY + Math.floor((Math.random() - 0.3) * 3)));
                if (!cells.some(c => c.gx === gx && c.gy === gy)) {
                    cells.push({ gx, gy });
                }
            }
            if (!cells.some(c => Math.abs(c.gx - drill.gridX) <= 1 && Math.abs(c.gy - drill.gridY) <= 1)) {
                cells[0] = {
                    gx: drill.gridX,
                    gy: Math.min(CONFIG.LAYER_ROWS - 4, drill.gridY + 1)
                };
            }
            const warnTime = isDeepZone ? 1.8 : 2.2;
            this.activeEvents.push({
                type: 'MAGMA_ERUPTION',
                timer: warnTime,
                maxTimer: warnTime,
                cells
            });
            this.showWarning(
                `! ТЕКТОНИЧЕСКОЕ ИЗВЕРЖЕНИЕ (${warnTime.toFixed(1)}с) !`,
                'Клетки под вами раскаляются — спокойно сместитесь в сторону!'
            );
        } else if (roll < 0.68) {
            // 2. ПИРОКЛАСТИЧЕСКИЙ ПРОРЫВ
            const targetRow = drill.gridY;
            const fromLeft = Math.random() < 0.5;
            const warnTime = isDeepZone ? 1.9 : 2.3;
            this.activeEvents.push({
                type: 'THERMAL_JET',
                timer: warnTime,
                maxTimer: warnTime,
                rows: [targetRow],
                fromLeft
            });
            this.showWarning(
                fromLeft ? `>>> ОГНЕННЫЙ ПРОРЫВ СЛЕВА (${warnTime.toFixed(1)}с) >>>` : `<<< ОГНЕННЫЙ ПРОРЫВ СПРАВА (${warnTime.toFixed(1)}с) <<<`,
                'Один ряд мигает красным — пробуритесь на 1 блок ниже!'
            );
        } else {
            // 3. СЕЙСМИЧЕСКИЙ КАМНЕПАД СВЕРХУ
            const cols = [drill.gridX];
            const offsetCol = drill.gridX + (Math.random() < 0.5 ? -1 : 1);
            if (offsetCol >= 1 && offsetCol <= CONFIG.GRID_COLS - 2 && (isDeepZone || Math.random() < 0.65)) {
                cols.push(offsetCol);
            }

            this.activeEvents.push({
                type: 'CEILING_COLLAPSE',
                timer: 2.2,
                maxTimer: 2.2,
                cols,
                originY: Math.max(1, drill.gridY - 5)
            });
            this.showWarning('! СЕЙСМИЧЕСКИЙ КАМНЕПАД СВЕРХУ (2.2с) !', 'Отойдите на 1 клетку вбок из подсвеченной полосы!');
        }

        this.scheduleNext();
    }

    update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.spawnRandomEvent();
        }

        this.positiveTimer -= dt;
        if (this.positiveTimer <= 0) {
            this.spawnPositiveEvent();
        }

        // Обработка обратного отсчета телеграфируемых угроз
        for (let i = this.activeEvents.length - 1; i >= 0; i--) {
            const ev = this.activeEvents[i];
            ev.timer -= dt;
            if (ev.timer <= 0) {
                this.executeEvent(ev);
                this.activeEvents.splice(i, 1);
            }
        }

        // Обработка падающих сверху каменных глыб камнепада
        const ts = CONFIG.TILE_SIZE;
        for (let i = this.fallingDebris.length - 1; i >= 0; i--) {
            const d = this.fallingDebris[i];
            d.y += d.vy * dt;
            d.life -= dt;

            const gx = d.col;
            const gy = Math.floor(d.y / ts);

            // Проверка попадания по буру
            if (Math.abs(gx - this.game.drill.visualX) < 0.75 && Math.abs((d.y / ts) - (this.game.drill.visualY + 0.4)) < 0.75) {
                this.game.sound.playHazardExplosion();
                const dmg = this.game.drill.takeDamage(40, 'tectonic');
                this.game.spawnParticles(gx, this.game.drill.gridY, '#a8a29e', 18, 160);
                if (dmg > 0) {
                    this.game.spawnFloatingText(gx, this.game.drill.gridY, `КАМНЕПАД! -${dmg} HP`, '#f87171', true);
                }
                this.game.triggerDamageFeedback(
                    gx, this.game.drill.gridY, dmg,
                    'Прямое попадание Сейсмического Камнепада!',
                    'Смещайтесь влево или вправо из подсвеченных красных колонок.',
                    'collapse'
                );
                this.fallingDebris.splice(i, 1);
                continue;
            }

            // Столкновение с твердым блоком породы (раскалывает верхний блок укрытия)
            if (gy >= 1 && gy < CONFIG.LAYER_ROWS - 2) {
                const tile = this.game.grid[gy] && this.game.grid[gy][gx];
                if (tile && !tile.isEmpty() && !tile.proto.indestructible) {
                    this.game.spawnParticles(gx, gy, '#78716c', 10, 110);
                    tile.hp -= 48;
                    if (tile.hp <= 0) {
                        this.game.destroyBlock(gx, gy, true, 'environment');
                    }
                    this.fallingDebris.splice(i, 1);
                    continue;
                }
            }

            if (d.life <= 0 || gy >= CONFIG.LAYER_ROWS - 2) {
                this.fallingDebris.splice(i, 1);
            }
        }

        // Обработка падающих бонусных самоцветов «Золотого Кристаллопада»
        for (let i = this.fallingCrystals.length - 1; i >= 0; i--) {
            const c = this.fallingCrystals[i];
            c.y += c.vy * dt;
            c.life -= dt;
            const gx = c.col;
            const gy = Math.floor(c.y / ts);

            // Если бур поймал падающий самоцвет
            if (Math.abs(gx - this.game.drill.visualX) < 0.9 && Math.abs((c.y / ts) - (this.game.drill.visualY + 0.4)) < 0.9) {
                const oreGained = this.game.drill.addOre(c.oreReward);
                this.game.drill.addFuel(c.fuelReward);
                this.game.sound.playBlockBreak(true);
                this.game.spawnParticles(gx, this.game.drill.gridY, '#34d399', 14, 130);
                this.game.spawnFloatingText(gx, this.game.drill.gridY - 0.3, `+${oreGained} РУДЫ / +${c.fuelReward} ТОПЛ!`, '#fde047', true);
                this.fallingCrystals.splice(i, 1);
                continue;
            }

            // Если упал на твердый блок — превращает его в богатую жилу Кварца!
            if (gy >= 2 && gy < CONFIG.LAYER_ROWS - 3) {
                const tile = this.game.grid[gy] && this.game.grid[gy][gx];
                if (tile && !tile.isEmpty() && !tile.proto.indestructible && !tile.proto.isTechPod && !tile.proto.isStructureConsole) {
                    this.game.grid[gy][gx] = new BlockTile(gx, gy, TILE_TYPES.ORE_QUARTZ);
                    this.game.spawnParticles(gx, gy, '#22d3ee', 10, 90);
                    this.fallingCrystals.splice(i, 1);
                    continue;
                }
            }

            if (c.life <= 0 || gy >= CONFIG.LAYER_ROWS - 2) {
                this.fallingCrystals.splice(i, 1);
            }
        }

        // Визуальные потоки плазмы
        for (let i = this.plasmaBeams.length - 1; i >= 0; i--) {
            this.plasmaBeams[i].life -= dt;
            if (this.plasmaBeams[i].life <= 0) this.plasmaBeams.splice(i, 1);
        }
    }

    executeEvent(ev) {
        const drill = this.game.drill;
        const ts = CONFIG.TILE_SIZE;

        if (ev.type === 'MAGMA_ERUPTION') {
            this.game.sound.playHazardExplosion();
            this.game.screenShake = Math.max(this.game.screenShake, 0.28);
            let hitPlayer = false;

            ev.cells.forEach(({ gx, gy }) => {
                this.game.shockwaveRings.push({
                    x: (gx + 0.5) * ts,
                    y: (gy + 0.5) * ts,
                    radius: 6,
                    maxRadius: ts * 1.4,
                    color: '239, 68, 68',
                    life: 0.38,
                    maxLife: 0.38
                });
                this.game.spawnParticles(gx, gy, '#ef4444', 18, 175);
                this.game.spawnParticles(gx, gy, '#fde047', 10, 130);

                // Если бур стоит прямо на клетке извержения или вплотную
                if (Math.hypot(drill.gridX - gx, drill.gridY - gy) <= 1.05) {
                    hitPlayer = true;
                }

                // Клетка превращается в Карман Лавы или выгорает
                if (gy > 2 && gy < CONFIG.LAYER_ROWS - 3 && gx > 0 && gx < CONFIG.GRID_COLS - 1) {
                    const cur = this.game.grid[gy][gx];
                    if (cur && !cur.proto.isTechPod && !cur.proto.isStructureConsole && !cur.proto.isStation) {
                        if (Math.random() < 0.45) {
                            this.game.grid[gy][gx] = new BlockTile(gx, gy, TILE_TYPES.THERMAL_POCKET);
                        } else {
                            this.game.grid[gy][gx] = new BlockTile(gx, gy, TILE_TYPES.EMPTY);
                        }
                    }
                }
            });

            if (hitPlayer) {
                drill.addHeat(34);
                const dmg = drill.takeDamage(46, 'tectonic');
                if (dmg > 0) {
                    this.game.spawnFloatingText(drill.gridX, drill.gridY, `ИЗВЕРЖЕНИЕ! -${dmg} HP`, '#f87171', true);
                }
                this.game.triggerDamageFeedback(
                    drill.gridX, drill.gridY, dmg,
                    'Подземное Извержение Лавы!',
                    'Уходите с пульсирующих оранжевых клеток до окончания таймера.',
                    'eruption'
                );
            }
        } else if (ev.type === 'THERMAL_JET') {
            this.game.sound.playHazardExplosion();
            this.game.screenShake = Math.max(this.game.screenShake, 0.25);

            ev.rows.forEach((ry) => {
                this.plasmaBeams.push({
                    row: ry,
                    fromLeft: ev.fromLeft,
                    life: 0.42,
                    maxLife: 0.42
                });

                // Прожигает часть мягких блоков вдоль ряда
                for (let x = 1; x < CONFIG.GRID_COLS - 1; x++) {
                    const t = this.game.grid[ry] && this.game.grid[ry][x];
                    if (t && !t.isEmpty() && !t.proto.indestructible && !t.proto.isTechPod && !t.proto.isStructureConsole) {
                        t.hp -= 35;
                        if (t.hp <= 0) this.game.destroyBlock(x, ry, true, 'environment');
                    }
                }
            });

            if (ev.rows.includes(drill.gridY)) {
                drill.addHeat(32);
                const dmg = drill.takeDamage(44, 'tectonic');
                if (dmg > 0) {
                    this.game.spawnFloatingText(drill.gridX, drill.gridY, `ОГНЕННЫЙ ПОТОК! -${dmg} HP`, '#f87171', true);
                }
                this.game.triggerDamageFeedback(
                    drill.gridX, drill.gridY, dmg,
                    'Попадание в Пирокластический Поток!',
                    'Когда ряд мигает красным — быстро бурите вниз на безопасную глубину!',
                    'jet'
                );
            }
        } else if (ev.type === 'CEILING_COLLAPSE') {
            this.game.sound.playDrillHit(2.0, true);
            this.game.screenShake = Math.max(this.game.screenShake, 0.20);
            ev.cols.forEach((col) => {
                this.fallingDebris.push({
                    col,
                    y: ev.originY * ts,
                    vy: 300,
                    life: 2.1
                });
            });
        }
    }

    render(ctx, ts) {
        const now = performance.now();

        // 1. Отрисовка телеграфов предстоящих катастроф
        this.activeEvents.forEach((ev) => {
            const pct = Math.max(0, ev.timer / ev.maxTimer);
            const pulse = 0.55 + Math.sin(now * 0.022) * 0.35;

            if (ev.type === 'MAGMA_ERUPTION') {
                ev.cells.forEach(({ gx, gy }) => {
                    const px = gx * ts;
                    const py = gy * ts;

                    ctx.fillStyle = `rgba(239, 68, 68, ${0.32 * pulse})`;
                    ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);

                    ctx.strokeStyle = '#fb923c';
                    ctx.lineWidth = 2.5;
                    ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);

                    // Кольцо обратного отсчета
                    ctx.strokeStyle = '#fef08a';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(px + ts / 2, py + ts / 2, (ts * 0.38) * pct, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.font = 'extrabold 8px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`ВЗРЫВ ${ev.timer.toFixed(1)}с`, px + ts / 2, py + ts - 4);
                });
            } else if (ev.type === 'THERMAL_JET') {
                ev.rows.forEach((ry) => {
                    const py = ry * ts;
                    const totalW = CONFIG.GRID_COLS * ts;

                    ctx.fillStyle = `rgba(220, 38, 38, ${0.28 * pulse})`;
                    ctx.fillRect(ts, py + 2, totalW - ts * 2, ts - 4);

                    ctx.strokeStyle = '#f87171';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(ts, py + 2, totalW - ts * 2, ts - 4);

                    ctx.font = 'extrabold 10px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#fef08a';
                    const arrowText = ev.fromLeft
                        ? `>>> ОГНЕННЫЙ ПОТОК ЧЕРЕЗ ${ev.timer.toFixed(1)}с >>>`
                        : `<<< ОГНЕННЫЙ ПОТОК ЧЕРЕЗ ${ev.timer.toFixed(1)}с <<<`;
                    ctx.fillText(arrowText, totalW / 2, py + ts / 2 + 4);
                });
            } else if (ev.type === 'CEILING_COLLAPSE') {
                ev.cols.forEach((col) => {
                    const px = col * ts;
                    const startY = ev.originY * ts;
                    const heightY = ts * 9;

                    ctx.fillStyle = `rgba(245, 158, 11, ${0.22 * pulse})`;
                    ctx.fillRect(px + 4, startY, ts - 8, heightY);

                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + 4, startY, ts - 8, heightY);

                    ctx.font = 'extrabold 9px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#fef08a';
                    ctx.fillText(`КАМНИ ${ev.timer.toFixed(1)}с`, px + ts / 2, (this.game.drill.gridY - 1) * ts);
                    ctx.fillText('V V V', px + ts / 2, (this.game.drill.gridY - 0.5) * ts);
                });
            }
        });

        // 2. Отрисовка падающих каменных глыб
        this.fallingDebris.forEach((d) => {
            const px = d.col * ts + 8;
            const py = d.y;
            ctx.fillStyle = '#44403c';
            ctx.fillRect(px, py, ts - 16, ts - 16);
            ctx.fillStyle = '#a8a29e';
            ctx.fillRect(px + 4, py + 4, ts - 24, ts - 24);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, ts - 16, ts - 16);
        });

        // 2.5. Отрисовка падающих бонусных самоцветов «Золотого Кристаллопада»
        this.fallingCrystals.forEach((c) => {
            const px = c.col * ts + 10;
            const py = c.y;
            ctx.fillStyle = '#059669';
            ctx.fillRect(px, py, ts - 20, ts - 20);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(px + 4, py + 4, ts - 28, ts - 28);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2;
            ctx.strokeRect(px - 1, py - 1, ts - 18, ts - 18);
        });

        // 3. Отрисовка пирокластического плазменного потока
        this.plasmaBeams.forEach((b) => {
            const alpha = Math.max(0, b.life / b.maxLife);
            const py = b.row * ts;
            const totalW = CONFIG.GRID_COLS * ts;

            ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.85})`;
            ctx.fillRect(ts, py + 3, totalW - ts * 2, ts - 6);
            ctx.fillStyle = `rgba(254, 240, 138, ${alpha * 0.95})`;
            ctx.fillRect(ts, py + 11, totalW - ts * 2, ts - 22);
        });
    }
}
