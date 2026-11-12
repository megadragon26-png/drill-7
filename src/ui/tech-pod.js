/**
 * Взвешенный выбор оборудования и интерфейс техно-капсулы.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { MODULES_CATALOG } from '../data/modules.js';
import { RARITY_TIERS } from '../data/rarities.js';
import { MODIFIERS_CATALOG } from '../data/modifiers.js';

export class TechPodUI {
    pickWeightedModules(candidateIds, count = 2) {
        const uniqueCandidates = [...new Set(candidateIds)].filter((id) => {
            if (!MODULES_CATALOG[id]) return false;
            // Никогда не предлагаем модуль, если он уже установлен на буре и имеет максимальный 3-й уровень!
            if (this.drill && this.drill.getModuleLevel(id) >= 3) return false;
            return true;
        });

        const pool = [...uniqueCandidates];
        const selected = [];
        const depthBonus = (this.currentLayerNumber - 1) * 0.22;

        while (selected.length < count && pool.length > 0) {
            const weights = pool.map((id) => {
                const spec = MODULES_CATALOG[id];
                const r = RARITY_TIERS[spec ? spec.rarity : 'COMMON'] || RARITY_TIERS.COMMON;
                let w = r.dropWeight;
                // На глубоких слоях шанс встретить Эпический или Легендарный модуль растет
                if (r.id === 'EPIC' || r.id === 'LEGENDARY') {
                    w *= (1 + depthBonus);
                }
                // Если все слоты бура уже заняты, повышаем вес уже установленных модулей Ур.1–2, чтобы игрок мог их прокачать
                if (this.drill && this.drill.modules.length >= this.drill.moduleSlots && this.drill.hasModule(id)) {
                    w *= 2.2;
                }
                return { id, weight: w };
            });

            const totalW = weights.reduce((acc, item) => acc + item.weight, 0);
            let roll = Math.random() * totalW;
            let pickedId = weights[0].id;
            for (const item of weights) {
                if (roll < item.weight) {
                    pickedId = item.id;
                    break;
                }
                roll -= item.weight;
            }
            selected.push(pickedId);
            pool.splice(pool.indexOf(pickedId), 1);
        }
        return selected;
    }

    openTechPodModal() {
        this.state = 'POD';
        this.keys = { left: false, right: false, down: false };
        document.getElementById('modal-pod').classList.remove('hidden');

        // В сундуках попадаются открытые игроком модули + небольшой шанс найти неразблокированную реликвию, строго по весам редкости!
        const pool = [...this.meta.state.unlockedModules];
        Object.keys(MODULES_CATALOG).forEach((k) => {
            if (!pool.includes(k) && Math.random() < 0.35) pool.push(k);
        });

        this.currentPodOffers = this.pickWeightedModules(pool, 2);
        this.currentModifierOffers = this.getModifierOffers(2);
        this.renderTechPodUI();
    }

    renderTechPodUI() {
        document.getElementById('pod-slots-status').textContent =
            `Слоты: ${this.drill.modules.length}/${this.drill.moduleSlots}`;

        // Список установленных модулей (с иконкой и кнопкой быстрого снятия за +Руду)
        const installedEl = document.getElementById('pod-installed-list');
        installedEl.innerHTML = '';
        for (let i = 0; i < this.drill.moduleSlots; i++) {
            const m = this.drill.modules[i];
            const cell = document.createElement('div');
            if (m) {
                const spec = MODULES_CATALOG[m.id];
                const rInfo = RARITY_TIERS[spec.rarity || 'COMMON'];
                cell.className = 'bg-[#131a2c] px-2 py-1 rounded border border-cyan-500/40 flex items-center justify-between gap-1.5';
                const leftWrap = document.createElement('div');
                leftWrap.className = 'flex items-center gap-1.5 min-w-0';
                leftWrap.appendChild(this.art.createIconCanvasElement(this.art.moduleIcons[m.id], 18, 'w-4 h-4'));
                const titleSpan = document.createElement('span');
                titleSpan.className = `text-[10px] font-extrabold ${rInfo.textColor} truncate`;
                titleSpan.innerHTML = `${spec.shortName} <span class="text-cyan-300">Ур.${m.level}</span>`;
                leftWrap.appendChild(titleSpan);

                const sellBtn = document.createElement('button');
                sellBtn.className = 'btn-game px-1.5 py-0.5 rounded text-[9px] font-bold text-rose-300 shrink-0';
                sellBtn.textContent = `Снять (+${this.drill.getModuleRefund(m.id)})`;
                sellBtn.addEventListener('click', () => {
                    const refund = this.drill.uninstallModule(m.id);
                    this.drill.ore += refund;
                    this.sound.playBlockBreak(true);
                    this.renderTechPodUI();
                    this.updateHUD();
                });
                cell.appendChild(leftWrap);
                cell.appendChild(sellBtn);
            } else {
                cell.className = 'bg-[#0c101b] px-2 py-1 rounded border border-slate-800 text-[10px] text-slate-500 font-bold text-center';
                cell.textContent = `Слот #${i + 1} свободен`;
            }
            installedEl.appendChild(cell);
        }

        // 3 Карточки награды сундука-капсулы (с бейджами редкости и ценой улучшения по редкости)
        const grid = document.getElementById('pod-choices-grid');
        grid.innerHTML = '';

        this.currentPodOffers.forEach((modId) => {
            const spec = MODULES_CATALOG[modId];
            const rInfo = RARITY_TIERS[spec.rarity || 'COMMON'];
            const existing = this.drill.getModuleObj(modId);
            const isUpgrade = !!existing;
            const nextLvl = existing ? Math.min(3, existing.level + 1) : 1;
            // В капсуле установка нового модуля (Ур.1) бесплатна, а апгрейд до Ур.2/3 стоит 55% от цены улучшения (зависит от редкости!)
            const podUpgradeFee = isUpgrade && existing.level < 3
                ? Math.round(spec.upgradeCosts[existing.level - 1] * 0.55)
                : 0;
            const canInstall = isUpgrade
                ? (existing.level < 3 && this.drill.ore >= podUpgradeFee)
                : (this.drill.modules.length < this.drill.moduleSlots);

            const card = document.createElement('div');
            card.className = `interactive-card p-2.5 rounded-lg border flex flex-col justify-between gap-2 ${
                canInstall ? 'card-affordable cursor-pointer' : 'card-locked'
            }`;
            card.style.boxShadow = `0 0 16px ${rInfo.glowColor}`;

            const topWrap = document.createElement('div');
            const headerRow = document.createElement('div');
            headerRow.className = 'flex items-center gap-2';
            headerRow.appendChild(this.art.createIconCanvasElement(this.art.moduleIcons[modId], 28, 'w-7 h-7 border-cyan-400/50'));

            const metaBox = document.createElement('div');
            metaBox.className = 'min-w-0 flex-1';
            metaBox.innerHTML = `
                <div class="flex items-center justify-between gap-1 flex-wrap">
                    <span class="text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${rInfo.badgeBg}">${rInfo.name}</span>
                    <span class="text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                        canInstall ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300'
                    }">
                        ${isUpgrade ? `АПГРЕЙД Ур.${nextLvl}` : (canInstall ? 'НОВЫЙ МОДУЛЬ' : 'НЕТ СЛОТА')}
                    </span>
                </div>
                <div class="text-xs font-extrabold ${rInfo.textColor} truncate mt-1">${spec.name}</div>
            `;
            headerRow.appendChild(metaBox);
            topWrap.appendChild(headerRow);

            const descP = document.createElement('p');
            descP.className = 'text-[10px] text-slate-300 mt-1.5 leading-snug';
            descP.textContent = spec.descByLvl[nextLvl - 1];
            topWrap.appendChild(descP);
            card.appendChild(topWrap);

            const btn = document.createElement('button');
            btn.className = isUpgrade ? 'btn-emerald w-full py-1.5 rounded text-[10px] font-extrabold' : 'btn-cyan w-full py-1.5 rounded text-[10px] font-extrabold';
            btn.disabled = !canInstall;
            btn.textContent = isUpgrade
                ? (existing.level >= 3
                    ? 'МАКС. УРОВЕНЬ'
                    : (canInstall ? `Улучшить до Ур.${nextLvl} (${podUpgradeFee} Руды)` : `Нужно ${podUpgradeFee} Руды`))
                : (canInstall ? 'Установить Ур.1 (Бесплатно)' : 'Нет слота (Снимите выше)');

            const pickAction = () => {
                if (!canInstall || this.state !== 'POD') return;
                if (podUpgradeFee > 0) {
                    this.drill.ore -= podUpgradeFee;
                }
                this.drill.installModule(modId, podUpgradeFee);
                this.closeTechPodModal(`[${rInfo.name}] ${spec.shortName} (Ур.${nextLvl})`);
            };
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                pickAction();
            });
            if (canInstall) card.addEventListener('click', pickAction);

            card.appendChild(btn);
            grid.appendChild(card);
        });

        for (const id of this.currentModifierOffers) {
            const spec = MODIFIERS_CATALOG[id];
            const card = document.createElement('button');
            card.className = 'modifier-offer';
            card.style.borderColor = spec.color;
            const title = document.createElement('strong');
            title.textContent = spec.name;
            title.style.color = spec.color;
            const detail = document.createElement('span');
            detail.textContent = spec.desc;
            const badge = document.createElement('small');
            badge.textContent = 'МОДИФИКАТОР · БЕЗ СЛОТА · ВМЕСТО МОДУЛЯ';
            card.append(badge, title, detail);
            card.addEventListener('click', () => {
                if (this.state !== 'POD' || !this.drill.installModifier(id)) return;
                this.closeTechPodModal(spec.name);
            });
            grid.appendChild(card);
        }

        // 3-я карточка: Разобрать капсулу на Топливо + Руду + Ремонт
        const scrapCard = document.createElement('div');
        scrapCard.className = 'interactive-card card-affordable p-2.5 rounded-lg border flex flex-col justify-between gap-2 cursor-pointer';
        const scrapTop = document.createElement('div');
        const scrapHeader = document.createElement('div');
        scrapHeader.className = 'flex items-center gap-2';
        scrapHeader.appendChild(this.art.createIconCanvasElement(this.art.icons.fuel, 28, 'w-7 h-7 border-amber-400/50'));
        scrapHeader.innerHTML += `
            <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-extrabold text-amber-300 uppercase">Ресурсы</span>
                    <span class="text-[9px] font-extrabold bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">ВСЕГДА ДОСТУПНО</span>
                </div>
                <div class="text-xs font-extrabold text-white mt-0.5">Разобрать Капсулу</div>
            </div>
        `;
        scrapTop.appendChild(scrapHeader);
        scrapTop.innerHTML += `
            <p class="text-[10px] text-slate-300 mt-1.5 leading-snug">
                Мгновенно дает <strong>+35 Топлива</strong>, <strong>+12 Жизней</strong> и <strong>до 45 Руды</strong>.
            </p>
        `;
        scrapCard.appendChild(scrapTop);

        const scrapBtn = document.createElement('button');
        scrapBtn.className = 'btn-amber w-full py-1.5 rounded text-[10px] font-extrabold';
        scrapBtn.textContent = 'Забрать +35 Топл. и +45 Руды';
        const doScrap = () => {
            if (this.state !== 'POD') return;
            this.drill.addFuel(35);
            this.drill.hull = Math.min(this.drill.maxHull, this.drill.hull + 12);
            this.drill.addOre(45);
            this.closeTechPodModal('+35 ТОПЛИВА, +45 РУДЫ!');
        };
        scrapBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            doScrap();
        });
        scrapCard.addEventListener('click', doScrap);
        scrapCard.appendChild(scrapBtn);
        grid.appendChild(scrapCard);
    }

    closeTechPodModal(floatingMsg) {
        document.getElementById('modal-pod').classList.add('hidden');
        this.state = 'PLAYING';
        this.sound.playStationDock();
        if (floatingMsg) {
            this.spawnFloatingText(this.drill.visualX, this.drill.visualY - 0.3, floatingMsg, '#fde047', true);
        }
        this.updateHUD();
    }
}
