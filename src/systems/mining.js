/**
 * Разрушение клеток, добыча, предметы и создание эффектов.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { TILE_TYPES } from '../data/tiles.js';
import { BlockTile } from '../entities/block-tile.js';
import { Particle, FloatingText } from '../entities/effects.js';

export class MiningSystem {
    spawnParticles(gridX, gridY, color, count = 8, speed = 95, gravity = 180) {
        const limit = this.canvas?.width <= 640 ? 250 : 600;
        count = Math.min(count, Math.max(0, limit - this.particles.length));
        const cx = (gridX + 0.5) * CONFIG.TILE_SIZE;
        const cy = (gridY + 0.5) * CONFIG.TILE_SIZE;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = (0.3 + Math.random() * 0.8) * speed;
            this.particles.push(new Particle(
                cx + (Math.random() - 0.5) * 14,
                cy + (Math.random() - 0.5) * 14,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd - 20,
                color,
                2 + Math.floor(Math.random() * 3.5),
                0.25 + Math.random() * 0.3,
                gravity
            ));
        }
    }

    spawnFloatingText(gridX, gridY, text, color = '#fbbf24', isBig = false) {
        const limit = this.canvas?.width <= 640 ? 8 : 24;
        if (this.floatingTexts.length >= limit) this.floatingTexts.shift();
        const cx = (gridX + 0.5) * CONFIG.TILE_SIZE;
        const cy = gridY * CONFIG.TILE_SIZE;
        this.floatingTexts.push(new FloatingText(cx, cy, text, color, isBig));
    }

    destroyBlock(tx, ty, byWeapon = false, source = byWeapon ? 'weapon' : 'drill') {
        if (this.state !== 'PLAYING') return;
        if (ty < 0 || ty >= CONFIG.LAYER_ROWS || tx < 0 || tx >= CONFIG.GRID_COLS) return;
        const tile = this.grid[ty][tx];
        if (!tile || tile.isEmpty() || tile.proto.indestructible || tile.proto.isStation) return;
        if (source === 'environment' && (tile.proto.isStructureConsole || tile.proto.isTechPod)) return;

        const proto = tile.proto;
        if (source === 'drill' && !proto.isStructureConsole && !proto.isTechPod && !proto.hazard && !proto.fallingHazard) this.drill.registerDigFlow();
        const preservedBg = tile.bgType;
        this.spawnParticles(tx, ty, proto.color || '#94a3b8', 10, 110);
        const emptyTile = new BlockTile(tx, ty, TILE_TYPES.EMPTY);
        emptyTile.bgType = preservedBg;
        this.grid[ty][tx] = emptyTile;

        if (proto.isStructureConsole) {
            this.collectStructureCache(tile.structureId);
            return;
        }

        // Если это ТЕХНО-КАПСУЛА (СУНДУК МОДУЛЕЙ) — открываем окно выбора модуля прямо посреди спуска!
        if (proto.isTechPod) {
            this.sound.playStationDock();
            this.spawnParticles(tx, ty, '#38bdf8', 22, 140);
            this.openTechPodModal();
            return;
        }

        // НОВЫЙ ПРЕДМЕТ 1: Хроно-Сфера «Эфир» (останавливает расход топлива на 7 сек и ускоряет системы)
        if (proto.isChronoSphere) {
            this.drill.chronoBuffTimer = Math.max(this.drill.chronoBuffTimer, proto.chronoDuration || 7.0);
            this.drill.addHeat(-25);
            this.sound.playStationDock();
            this.spawnParticles(tx, ty, '#38bdf8', 24, 150);
            this.spawnFloatingText(tx, ty - 0.5, 'ХРОНО-СФЕРА: 7С БЕЗ ТРАТЫ ТОПЛИВА!', '#38bdf8', true);
        }

        // НОВЫЙ ПРЕДМЕТ 2: Звёздная Реликвия Предтеч (+35 Руды сразу в Глобальный Банк и сброс перезарядки модулей!)
        if (proto.isStarRelic) {
            const bankBonus = proto.bankBonus || 35;
            this.meta.depositOre(bankBonus);
            this.drill.modules.forEach((m) => { m.timer = 0; });
            this.sound.playStationDock();
            this.spawnParticles(tx, ty, '#fde047', 28, 165);
            this.spawnFloatingText(tx, ty - 0.65, `РЕЛИКВИЯ: +${bankBonus} В БАНК!`, '#fde047', true);
        }

        // 1. Пополнение топлива
        if (proto.fuelGain) {
            const gained = this.drill.addFuel(proto.fuelGain);
            if (proto.heatGen < 0) this.drill.addHeat(proto.heatGen);
            this.sound.playBlockBreak(true);
            this.spawnFloatingText(tx, ty, `+${gained} ТОПЛ`, '#fde047', true);
        }

        // 1.5. Целебная руда Виталиум (восстановление жизней корпуса)
        if (proto.hullGain) {
            const prevHull = this.drill.hull;
            this.drill.hull = Math.min(this.drill.maxHull, this.drill.hull + proto.hullGain);
            const healed = Math.max(0, Math.round(this.drill.hull - prevHull));
            if (proto.heatGen < 0) this.drill.addHeat(proto.heatGen);
            this.sound.playStationDock();
            this.spawnParticles(tx, ty, '#fb7185', 16, 125);
            this.spawnParticles(tx, ty, '#34d399', 12, 95);
            if (healed > 0) this.spawnFloatingText(tx, ty - 0.55, `+${healed} ЖИЗНЕЙ!`, '#fb7185', true);
        }

        // 2. Добыча Руды
        if (proto.oreValue) {
            const gainedOre = this.drill.addOre(proto.oreValue);
            this.sound.playBlockBreak(true);
            this.spawnFloatingText(tx, ty - 0.25, `+${gainedOre} РУДЫ`, '#38bdf8', true);

            // Срабатывание модуля «Рудный Пулемёт Вулкан» при добыче руды!
            const gatlingLvl = this.drill.getModuleLevel('ORE_GATLING');
            if (gatlingLvl > 0) {
                this.fireOreGatlingVolley(gatlingLvl);
            }
        }

        this.onModifierBlockDestroyed(tx, ty, proto, byWeapon, tile.frozen, source);

        // 3. Зеленый Газ
        if (proto.hazard === 'gas') {
            const gasFilterLvl = this.drill.getModuleLevel('GAS_FILTER');
            if (gasFilterLvl > 0 || byWeapon) {
                const fuelBonus = gasFilterLvl > 0
                    ? MODULES_CATALOG.GAS_FILTER.fuelBonus[gasFilterLvl - 1]
                    : 14;
                const gained = this.drill.addFuel(fuelBonus);
                if (gasFilterLvl >= 2) this.drill.addOre(15);
                if (gasFilterLvl > 0) {
                    this.fireRocketSalvo(MODULES_CATALOG.GAS_FILTER.bonusRockets[gasFilterLvl - 1]);
                }
                this.sound.playBlockBreak(true);
                this.spawnParticles(tx, ty, '#a3e635', 16, 95);
                this.spawnFloatingText(tx, ty, `ГАЗ: +${gained} ТОПЛ`, '#a3e635', true);
            } else {
                this.sound.playHazardExplosion();
                this.spawnParticles(tx, ty, '#84cc16', 24, 180);
                this.spawnParticles(tx, ty, '#f97316', 20, 210);
                const dmg = this.drill.takeDamage(proto.damage, 'gas');

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = tx + dx, ny = ty + dy;
                        if (ny > 0 && ny < CONFIG.LAYER_ROWS - 2 && nx > 0 && nx < CONFIG.GRID_COLS - 1) {
                            const nb = this.grid[ny][nx];
                            if (nb && !nb.isEmpty() && !nb.proto.indestructible && !nb.proto.isTechPod && !nb.proto.isStructureConsole) {
                                this.grid[ny][nx] = new BlockTile(nx, ny, TILE_TYPES.EMPTY);
                            }
                        }
                    }
                }

                if (dmg > 0) {
                    this.spawnFloatingText(tx, ty, `ВЗРЫВ! -${dmg} HP`, '#f87171', true);
                }
                this.triggerDamageFeedback(
                    tx, ty, dmg,
                    'Взрыв Зеленого Газа!',
                    'Взрывайте газ оружием издалека или ставьте «Фильтр-Реактор Газа».',
                    'gas'
                );
            }
            return;
        }

        // 4. Карман Лавы
        if (proto.hazard === 'lava') {
            this.sound.playHazardExplosion();
            this.spawnParticles(tx, ty, '#ef4444', 24, 165);
            if (!byWeapon) {
                this.drill.addHeat(proto.heatGen);
                const dmg = this.drill.takeDamage(proto.damage, 'lava');
                if (dmg > 0) {
                    this.spawnFloatingText(tx, ty, `ЛАВА! -${dmg} HP`, '#f87171', true);
                }
                this.triggerDamageFeedback(
                    tx, ty, dmg,
                    'Ожог раскаленной Лавой!',
                    'Используйте «Крио-Импульс Буран», чтобы превращать лаву в Обсидиан.',
                    'lava'
                );
            }
            return;
        }

        // 5. Кислотный Карман (Слои 2 и 4)
        if (proto.hazard === 'acid') {
            const gasFilterLvl = this.drill.getModuleLevel('GAS_FILTER');
            if (gasFilterLvl > 0 || byWeapon) {
                const gained = this.drill.addFuel(12);
                this.sound.playBlockBreak(true);
                this.spawnParticles(tx, ty, '#4ade80', 14, 95);
                this.spawnFloatingText(tx, ty, `КИСЛОТА НЕЙТРАЛИЗОВАНА: +${gained} ТОПЛ`, '#4ade80', true);
            } else {
                this.sound.playHazardExplosion();
                this.spawnParticles(tx, ty, '#22c55e', 24, 175);
                const fuelLost = proto.fuelDrain || 10;
                this.drill.consumeFuel(fuelLost, this);
                const dmg = this.drill.takeDamage(proto.damage, 'gas');
                if (dmg > 0) {
                    this.spawnFloatingText(tx, ty, `КИСЛОТА! -${dmg} HP / -${fuelLost} ТОПЛ`, '#4ade80', true);
                }
                this.triggerDamageFeedback(
                    tx, ty, dmg,
                    'Разъедание Кислотным Карманом (-Топливо и -HP)!',
                    'Взрывайте кислоту оружием издалека или используйте «Фильтр-Реактор Газа».',
                    'gas'
                );
            }
            return;
        }

        // 6. Аномалия Пустоты (Слой 6 — Ядро)
        if (proto.hazard === 'void') {
            this.sound.playHazardExplosion();
            this.spawnParticles(tx, ty, '#c084fc', 26, 185);
            if (!byWeapon) {
                this.drill.addHeat(proto.heatGen);
                const dmg = this.drill.takeDamage(proto.damage, 'tectonic');
                if (dmg > 0) {
                    this.spawnFloatingText(tx, ty, `ПУСТОТА! -${dmg} HP`, '#c084fc', true);
                }
                this.triggerDamageFeedback(
                    tx, ty, dmg,
                    'Детонация Аномалии Пустоты!',
                    'Расстреливайте фиолетовые блоки Пустоты ракетами, лазерами или пилами.',
                    'eruption'
                );
            } else {
                const bonusOre = this.drill.addOre(25);
                this.spawnFloatingText(tx, ty, `АННИГИЛЯЦИЯ: +${bonusOre} РУДЫ`, '#c084fc', true);
            }
            return;
        }

        // 7. Крио-Осколок Холода (Слой 2Б — Мерзлотные Крио-Шахты)
        if (proto.hazard === 'cryo') {
            const hasFrost = this.drill.hasModule('FROST_NOVA') || this.drill.hasModule('THERMAL_AEGIS');
            if (byWeapon || hasFrost) {
                const bonusOre = this.drill.addOre(24);
                this.drill.addHeat(-25);
                this.sound.playBlockBreak(true);
                this.spawnParticles(tx, ty, '#38bdf8', 16, 120);
                this.spawnFloatingText(tx, ty, `КРИО: +${bonusOre} РУДЫ`, '#38bdf8', true);
            } else {
                this.sound.playHazardExplosion();
                this.spawnParticles(tx, ty, '#7dd3fc', 22, 160);
                this.drill.cryoSlowTimer = 4.0;
                this.drill.addHeat(-30);
                const dmg = this.drill.takeDamage(proto.damage, 'rock');
                if (dmg > 0) {
                    this.spawnFloatingText(tx, ty, `ОБЛЕДЕНЕНИЕ! -${dmg} HP`, '#38bdf8', true);
                }
                this.triggerDamageFeedback(
                    tx, ty, dmg,
                    'Крио-Осколок заморозил привод бура (-38% скорости на 4с)!',
                    'Взрывайте Крио-Осколки оружием или используйте «Буран» / «Саламандру» для добычи +24 Руды.',
                    'rock'
                );
            }
            return;
        }

        // 8. Электро-Конденсатор (Слой 3Б — Магнитные Шторм-Разломы)
        if (proto.hazard === 'electro') {
            const hasTesla = this.drill.hasModule('TESLA_COIL');
            if (byWeapon || hasTesla) {
                const gainedFuel = this.drill.addFuel(20);
                this.drill.modules.forEach((m) => { m.timer = Math.max(0, m.timer * 0.25); });
                this.sound.playTeslaZap();
                this.spawnParticles(tx, ty, '#fde047', 18, 135);
                this.spawnFloatingText(tx, ty, `ЗАРЯД: +${gainedFuel} ТОПЛ!`, '#fde047', true);
            } else {
                this.sound.playTeslaZap();
                this.spawnParticles(tx, ty, '#facc15', 24, 175);
                // Сбрасывает таймеры перезарядки модулей при контактном замыкании!
                this.drill.modules.forEach((m) => {
                    const spec = MODULES_CATALOG[m.id];
                    if (spec && spec.isActiveTimer) m.timer = spec.cooldowns[m.level - 1];
                });
                const dmg = this.drill.takeDamage(proto.damage, 'tectonic');
                if (dmg > 0) {
                    this.spawnFloatingText(tx, ty, `ЭЛЕКТРО-ШОК! -${dmg} HP`, '#fde047', true);
                }
                this.triggerDamageFeedback(
                    tx, ty, dmg,
                    'Короткое замыкание от Электро-Конденсатора!',
                    'Взрывайте конденсаторы оружием или «Тесла-Катушкой», чтобы получать +20 Топлива!',
                    'jet'
                );
            }
            return;
        }

        // 9. Реакторная Мина Древних (Слой 4Б / 5Б — Кладбище Машин и Серный Котел)
        if (proto.hazard === 'mine') {
            if (byWeapon) {
                const gainedOre = this.drill.addOre(40);
                this.sound.playBlockBreak(true);
                this.spawnParticles(tx, ty, '#fb923c', 18, 140);
                this.spawnFloatingText(tx, ty, `РАЗМИНИРОВАНО: +${gainedOre} РУДЫ`, '#fbbf24', true);
            } else {
                this.sound.playHazardExplosion();
                this.spawnParticles(tx, ty, '#ea580c', 26, 200);
                const dmg = this.drill.takeDamage(proto.damage, 'gas');
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = tx + dx, ny = ty + dy;
                        if (ny > 0 && ny < CONFIG.LAYER_ROWS - 2 && nx > 0 && nx < CONFIG.GRID_COLS - 1) {
                            const nb = this.grid[ny][nx];
                            if (nb && !nb.isEmpty() && !nb.proto.indestructible && !nb.proto.isTechPod && !nb.proto.isStructureConsole) {
                                this.grid[ny][nx] = new BlockTile(nx, ny, TILE_TYPES.EMPTY);
                            }
                        }
                    }
                }
                if (dmg > 0) {
                    this.spawnFloatingText(tx, ty, `МИНА! -${dmg} HP`, '#f87171', true);
                }
                this.triggerDamageFeedback(
                    tx, ty, dmg,
                    'Подрыв на Реакторной Мине Древних!',
                    'Расстреливайте мины ракетами, лазерами или пилами издалека ради +40 Руды!',
                    'gas'
                );
            }
            return;
        }

        if (!proto.fuelGain && !proto.oreValue) {
            this.sound.playBlockBreak(false);
        }
    }
}
