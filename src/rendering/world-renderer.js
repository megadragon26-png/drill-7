/**
 * Canvas-рендер мира, станции, освещения, снарядов и эффектов.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { BIOMES } from '../data/biomes.js';
import { CONFIG } from '../data/config.js';
import { TILE_TYPES } from '../data/tiles.js';

export class WorldRenderer {
    renderStationStructure(ctx, ts) {
        const gateTopY = (CONFIG.LAYER_ROWS - 3) * ts;
        const gateDoorY = (CONFIG.LAYER_ROWS - 2) * ts;
        const leftGateX = 3 * ts;
        const rightGateX = (CONFIG.GRID_COLS - 3) * ts;
        const gateWidth = rightGateX - leftGateX;
        const now = performance.now();
        const pulse = 0.6 + Math.sin(now * 0.006) * 0.35;

        ctx.save();

        // 1. Освещенный предшлюзовый зал (ряд rows - 3)
        const bayGrad = ctx.createLinearGradient(0, gateTopY, 0, gateTopY + ts * 3);
        bayGrad.addColorStop(0, 'rgba(8, 47, 73, 0.55)');
        bayGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.28)');
        bayGrad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
        ctx.fillStyle = bayGrad;
        ctx.fillRect(leftGateX, gateTopY, gateWidth, ts * 3);

        // Стальные фермы и направляющие колонны по бокам шлюза (x = 1..2 и cols-3..cols-2)
        [1 * ts, (CONFIG.GRID_COLS - 3) * ts].forEach((pillarX) => {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(pillarX, gateTopY, ts * 2, ts * 3);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(pillarX + 2, gateTopY + 2, ts * 2 - 4, ts * 3 - 4);

            // Пульсирующие сигнальные маяки на колоннах
            ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
            ctx.fillRect(pillarX + ts - 8, gateTopY + 8, 16, 8);
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(pillarX + ts - 4, gateTopY + 10, 8, 4);
        });

        // 2. Анимированные посадочные шевроны (стрелки вниз), ведущие бур в шлюз
        const chevronPhase = (now * 0.04) % 16;
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.45 + pulse * 0.4})`;
        ctx.lineWidth = 2.5;
        for (let gx = 4; gx < CONFIG.GRID_COLS - 4; gx += 2) {
            const cx = (gx + 0.5) * ts;
            const cy = gateTopY + 10 + chevronPhase;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy - 6);
            ctx.lineTo(cx, cy + 3);
            ctx.lineTo(cx + 10, cy - 6);
            ctx.stroke();
        }

        // 3. Бронированная рама гермоворот и энергетическое поле стыковки (ряды rows - 2 и rows - 1)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(leftGateX, gateDoorY, gateWidth, ts * 2);

        // Желто-черная предупреждающая полоса по кромке шлюза
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(leftGateX, gateDoorY, gateWidth, 7);
        ctx.fillStyle = '#090d16';
        for (let sx = leftGateX; sx < rightGateX; sx += 16) {
            ctx.fillRect(sx, gateDoorY, 8, 7);
        }

        // Светящийся энергетический портал приемного бункера
        const portalGrad = ctx.createLinearGradient(0, gateDoorY + 8, 0, gateDoorY + ts * 2);
        portalGrad.addColorStop(0, `rgba(34, 211, 238, ${0.45 * pulse})`);
        portalGrad.addColorStop(1, 'rgba(2, 132, 199, 0.85)');
        ctx.fillStyle = portalGrad;
        ctx.fillRect(leftGateX + 6, gateDoorY + 9, gateWidth - 12, ts * 2 - 14);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftGateX + 2, gateDoorY + 2, gateWidth - 4, ts * 2 - 4);

        // 4. Крупное голографическое табло над входом в станцию
        const centerX = (CONFIG.GRID_COLS * ts) / 2;
        ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
        ctx.fillRect(centerX - 155, gateDoorY + 14, 310, 38);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 155, gateDoorY + 14, 310, 38);

        ctx.textAlign = 'center';
        ctx.font = '800 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#67e8f9';
        ctx.fillText(`ПОДЗЕМНАЯ СТАНЦИЯ #${this.currentLayerNumber} — ГЕРМОШЛЮЗ ОТКРЫТ`, centerX, gateDoorY + 30);

        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fde047';
        ctx.fillText('▼ ОПУСТИТЕСЬ СЮДА ДЛЯ РЕМОНТА, ПОКУПОК И БАНКА ▼', centerX, gateDoorY + 45);

        ctx.restore();
    }

    render() {
        if (this.state === 'MENU') return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ts = CONFIG.TILE_SIZE;
        const now = performance.now();

        const biome = BIOMES[this.currentBiomeIndex] || BIOMES[0];
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, biome.bgTop);
        bgGrad.addColorStop(1, biome.bgBottom);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        if (!this.drill || !this.grid.length) return;

        ctx.save();
        const gridPixelWidth = CONFIG.GRID_COLS * ts;
        // Автоматическое масштабирование всей 15-колоночной шахты под ширину мобильного экрана
        const viewScale = Math.min(1, w / gridPixelWidth);
        const scaledGridW = gridPixelWidth * viewScale;
        const offsetX = Math.floor((w - scaledGridW) / 2);
        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * 12 : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * 12 : 0;

        ctx.translate(offsetX + shakeX, shakeY);
        ctx.scale(viewScale, viewScale);
        ctx.translate(0, -Math.floor(this.cameraY));

        const virtualViewH = h / viewScale;
        const startRow = Math.max(0, Math.floor(this.cameraY / ts) - 2);
        const endRow = Math.min(CONFIG.LAYER_ROWS - 1, Math.ceil((this.cameraY + virtualViewH) / ts) + 2);
        const extraVision = this.drill.hasModule('MAGNET_GRAB') ? 2.0 : 0;
        const lightRadius = CONFIG.LIGHT_RADIUS + extraVision;

        // Красивый детализированный фон выкопанной шахты (вместо мрачной черной дыры!)
        ctx.fillStyle = biome.shaftWall || '#1f1619';
        ctx.fillRect(ts, startRow * ts, gridPixelWidth - ts * 2, (endRow - startRow + 1) * ts);

        // Опорные балки шахты, вертикальные направляющие и подземные фонари каждые 4 ряда
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(ts * 3, startRow * ts, 6, (endRow - startRow + 1) * ts);
        ctx.fillRect(gridPixelWidth - ts * 3 - 6, startRow * ts, 6, (endRow - startRow + 1) * ts);

        for (let ry = startRow; ry <= endRow; ry++) {
            if (ry > 2 && ry % 4 === 0) {
                const by = ry * ts;
                ctx.fillStyle = biome.shaftBeam || '#382622';
                ctx.fillRect(ts, by, gridPixelWidth - ts * 2, 8);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(ts, by, gridPixelWidth - ts * 2, 2);

                // Теплые шахтерские фонари на балках
                [ts * 3 + 3, gridPixelWidth - ts * 3 - 3].forEach((lx) => {
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(lx - 3, by + 4, 6, 6);
                    ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
                    ctx.beginPath();
                    ctx.arc(lx, by + 7, 22, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        }

        // Отрисовка тайлов породы, фонов пещер и подземных построек
        for (let y = startRow; y <= endRow; y++) {
            for (let x = 0; x < CONFIG.GRID_COLS; x++) {
                const tile = this.grid[y][x];
                if (!tile) continue;

                const px = x * ts;
                const py = y * ts;
                const dist = Math.hypot(x - this.drill.visualX, y - (this.drill.visualY + 0.5));

                // Атмосферный живописный фон для пещер, бункеров, руин и жеод (виден в пустых клетках)
                if (tile.isEmpty()) {
                    if (tile.bgType === 'cave') {
                        ctx.fillStyle = 'rgba(14, 28, 54, 0.55)';
                        ctx.fillRect(px, py, ts, ts);
                        if ((x + y) % 3 === 0) {
                            ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
                            ctx.fillRect(px + 18, py + 14, 6, 14);
                        }
                    } else if (tile.bgType === 'bunker') {
                        ctx.fillStyle = '#17253b';
                        ctx.fillRect(px, py, ts, ts);
                        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
                        ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
                        ctx.fillRect(px + 4, py + ts / 2 - 2, ts - 8, 4);
                    } else if (tile.bgType === 'ruins') {
                        ctx.fillStyle = '#231d47';
                        ctx.fillRect(px, py, ts, ts);
                        ctx.strokeStyle = 'rgba(192, 132, 252, 0.32)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px + 3, py + 3, ts - 6, ts - 6);
                    } else if (tile.bgType === 'geode') {
                        ctx.fillStyle = '#361847';
                        ctx.fillRect(px, py, ts, ts);
                        ctx.fillStyle = 'rgba(244, 114, 182, 0.28)';
                        ctx.fillRect(px + 8, py + 8, ts - 16, ts - 16);
                    }
                    continue;
                }

                const wobbleX = tile.isWobbling ? Math.sin(now * 0.05) * 3 : 0;

                // Шлюз станции отрисовывается отдельным детализированным бункером
                if (tile.proto.isStation) continue;

                const texKey = Object.keys(TILE_TYPES).find(k => TILE_TYPES[k].id === tile.proto.id);
                const tex = this.art.textures[texKey];

                ctx.imageSmoothingEnabled = false;
                if (tex) {
                    ctx.drawImage(tex, px + wobbleX, py, ts, ts);
                } else {
                    ctx.fillStyle = tile.proto.color || '#475569';
                    ctx.fillRect(px + wobbleX, py, ts, ts);
                }

                // Живое мерцание и мягкое свечение руд, кристаллов, Виталиума, Энергоблоков и Сундуков
                if (tile.proto.isStructureConsole) {
                    ctx.fillStyle = '#083344';
                    ctx.fillRect(px + 5, py + 5, ts - 10, ts - 10);
                    ctx.strokeStyle = '#67e8f9';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + 8, py + 8, ts - 16, ts - 18);
                    ctx.fillStyle = '#a5f3fc';
                    ctx.font = 'bold 22px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('◆', px + ts / 2, py + 29);
                    ctx.textAlign = 'left';
                }
                if (tile.frozen) {
                    ctx.fillStyle = 'rgba(125, 211, 252, 0.3)';
                    ctx.fillRect(px + 1, py + 1, ts - 2, ts - 2);
                    ctx.strokeStyle = '#a5f3fc';
                    ctx.strokeRect(px + 3, py + 3, ts - 6, ts - 6);
                }

                // Живое мерцание и мягкое свечение руд, кристаллов, Виталиума, Энергоблоков и Сундуков
                if (tile.proto.glowColor) {
                    const shimmer = 0.16 + Math.sin(now * 0.005 + x * 1.7 + y * 2.3) * 0.08;
                    ctx.fillStyle = `rgba(${tile.proto.glowColor}, ${shimmer})`;
                    ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);

                    // Искрящийся блик на самоцветах
                    if ((x * 7 + y * 13 + Math.floor(now / 260)) % 11 === 0) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(px + 12, py + 10, 4, 4);
                        ctx.fillRect(px + 26, py + 24, 3, 3);
                    }
                }

                // Светящиеся трещины при бурении блока
                if (tile.hp < tile.maxHp && !tile.proto.indestructible) {
                    const dmgRatio = 1 - tile.hp / tile.maxHp;
                    ctx.strokeStyle = '#fef08a';
                    ctx.lineWidth = 2.2;
                    ctx.beginPath();
                    ctx.moveTo(px + 8, py + 8);
                    ctx.lineTo(px + ts * dmgRatio, py + ts * dmgRatio);
                    if (dmgRatio > 0.45) {
                        ctx.moveTo(px + ts - 8, py + 10);
                        ctx.lineTo(px + ts * (1 - dmgRatio), py + ts * dmgRatio);
                    }
                    ctx.stroke();
                }

                // Текстовые подсказки по рудам и предметам убраны с экрана во время игры;
                // оставлена только рамка критического давления газа перед взрывом
                if (dist <= 3.5 && tile.proto.hazard === 'gas' && tile.pressureTimer > 0.25) {
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2.5;
                    ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
                }

                // Мягкое атмосферное затенение на большой глубине (вместо глухой черной темноты),
                // при этом руды, самоцветы и лава продолжают ярко светиться сквозь сумрак!
                if (dist > lightRadius && !tile.proto.isStation && !tile.proto.isTechPod) {
                    const maxShade = tile.proto.glowColor ? 0.22 : 0.44;
                    const shade = Math.min(maxShade, (dist - lightRadius) * 0.12);
                    ctx.fillStyle = `rgba(10, 18, 38, ${shade})`;
                    ctx.fillRect(px, py, ts, ts);
                }
            }
        }

        // Парящие подземные светлячки / кристаллическая пыльца / искры магмы
        for (let m = 0; m < 18; m++) {
            const mx = ((m * 97 + Math.sin(now * 0.0012 + m) * 45) % (gridPixelWidth - ts * 2)) + ts;
            const my = this.cameraY + ((m * 73 + now * 0.025 * (m % 2 === 0 ? 1 : -1)) % h + h) % h;
            const mAlpha = 0.35 + Math.sin(now * 0.004 + m * 2) * 0.25;
            ctx.fillStyle = biome.ambientColor || '#fde047';
            ctx.globalAlpha = Math.max(0.1, mAlpha);
            ctx.fillRect(mx, my, 3, 3);
        }
        ctx.globalAlpha = 1.0;

        // Отрисовка бункера Подземной Станции на дне слоя
        if (endRow >= CONFIG.LAYER_ROWS - 4) {
            this.renderStationStructure(ctx, ts);
        }

        // Отрисовка динамических тектонических угроз
        this.hazardDirector.render(ctx, ts);
        this.renderWorldThreats(ctx, ts, startRow, endRow);

        // Отрисовка ударных колец
        this.shockwaveRings.forEach((r) => {
            const alpha = Math.max(0, r.life / r.maxLife);
            ctx.strokeStyle = `rgba(${r.color}, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Отрисовка лазерных лучей
        this.laserBeams.forEach((b) => {
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(b.x1, b.y1);
            ctx.lineTo(b.x2, b.y2);
            ctx.stroke();
        });

        // Отрисовка цепных молний Тесла
        this.lightningArcs.forEach((arc) => {
            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(arc.x1, arc.y1);
            const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 14;
            const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 14;
            ctx.lineTo(midX, midY);
            ctx.lineTo(arc.x2, arc.y2);
            ctx.stroke();
        });

        // Отрисовка самонаводящихся ракет
        this.rockets.forEach((r) => {
            ctx.fillStyle = '#f97316';
            ctx.fillRect(r.x - 4, r.y - 4, 8, 8);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(r.x - 2, r.y - 2, 4, 4);
        });

        // Отрисовка прыгающих сейсмо-бомб
        this.bombs.forEach((b) => {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Отрисовка бронебойных снарядов «Вулкана» и дисковых пил «Жнеца»
        this.projectiles.forEach((p) => {
            if (p.type === 'saw') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = '#2dd4bf';
                ctx.fillRect(-8, -8, 16, 16);
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(-10, -2, 20, 4);
                ctx.fillRect(-2, -10, 4, 20);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(-3, -3, 6, 6);
                ctx.restore();
            } else {
                ctx.fillStyle = '#fde047';
                ctx.fillRect(p.x - 3, p.y - 5, 6, 10);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(p.x - 1, p.y - 3, 2, 6);
            }
        });

        // Отрисовка бура, орбитальных дронов и мини-HUD над буром
        this.renderDrillSprite(ctx, ts);
        this.renderOrbitingDrones(ctx, ts);
        this.renderOnDrillMiniHUD(ctx, ts);

        // Отрисовка частиц
        this.particles.forEach((p) => {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        // Отрисовка всплывающего текста
        this.floatingTexts.forEach((ft) => {
            ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
            ctx.font = ft.isBig
                ? '800 12px "JetBrains Mono", monospace'
                : '700 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000000';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
        });
        ctx.globalAlpha = 1.0;

        // Стоп-кадр на месте гибели
        if (this.state === 'FATAL_SEQUENCE' && this.deathInfo) {
            const gx = this.deathInfo.gridX * ts;
            const gy = this.deathInfo.gridY * ts;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(gx - 4, gy - 4, ts + 8, ts + 8);

            ctx.font = '800 13px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#090d16';
            ctx.fillRect(gx + ts / 2 - 125, gy - 28, 250, 22);
            ctx.strokeStyle = '#f87171';
            ctx.strokeRect(gx + ts / 2 - 125, gy - 28, 250, 22);
            ctx.fillStyle = '#fecaca';
            ctx.fillText(this.deathInfo.canvasLabel, gx + ts / 2, gy - 13);
        }

        ctx.restore();

        // Красная виньетка при получении урона
        if (this.damageFlashTimer > 0) {
            ctx.fillStyle = `rgba(220, 38, 38, ${this.damageFlashTimer * 0.45})`;
            ctx.fillRect(0, 0, w, h);
        }
    }
}
