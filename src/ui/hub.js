/**
 * Ангар: постоянные слоты, проекты, чертежи и отчёт.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { META_SLOT_COSTS } from '../data/progression.js';
import { META_PROJECTS_CATALOG } from '../data/projects.js';
import { RARITY_TIERS } from '../data/rarities.js';

export class HubUI {
    setHubTab(tab) {
        this.hubTab = ['slots', 'mods', 'proj'].includes(tab) ? tab : 'slots';
        for (const [id, section] of [['hub-sec-top', 'slots'], ['hub-sec-unlocks', 'mods'], ['hub-sec-projects', 'proj']]) {
            document.getElementById(id).classList.toggle('mobile-tab-hidden', this.hubTab !== section);
        }
        for (const [id, section] of [['hub-tab-slots', 'slots'], ['hub-mob-tab-mods', 'mods'], ['hub-mob-tab-proj', 'proj']]) {
            document.getElementById(id).setAttribute('aria-selected', String(section === this.hubTab));
        }
    }

    openHubModal(reportMessage = null) {
        this.setApplicationShell('overlay');
        this.setHubTab('slots');
        this.state = 'HUB';
        this.keys = { left: false, right: false, down: false };
        document.getElementById('modal-station').classList.add('hidden');
        document.getElementById('modal-pod').classList.add('hidden');
        document.getElementById('modal-death').classList.add('hidden');
        document.getElementById('overheat-banner').classList.add('hidden');
        document.getElementById('tectonic-warning-banner').classList.add('hidden');
        document.getElementById('damage-alert-banner').classList.add('hidden');
        document.getElementById('modal-hub').classList.remove('hidden');

        const reportEl = document.getElementById('hub-run-report');
        if (reportEl) {
            if (reportMessage) {
                reportEl.textContent = reportMessage;
                reportEl.classList.remove('hidden');
            } else {
                reportEl.classList.add('hidden');
            }
        }

        this.renderHubUI();
    }

    hubUpgradeBaseSlots() {
        const nextSlot = this.meta.state.baseModuleSlots + 1;
        if (nextSlot > CONFIG.MAX_MODULE_SLOTS) return;
        const cost = META_SLOT_COSTS[nextSlot];
        if (this.meta.spendOre(cost)) {
            this.meta.state.baseModuleSlots = nextSlot;
            this.meta.save();
            this.sound.playStationDock();
            this.renderHubUI();
        }
    }

    renderHubUI() {
        document.getElementById('btn-start-run').textContent = this.hasActiveRun ? 'Продолжить забег' : 'Начать экспедицию';
        const bank = this.meta.state.bankOre;
        document.getElementById('hub-bank-resources').textContent = `${bank} Руды`;

        let affordableCount = 0;

        // 1. Карточка расширения стартовых слотов
        const currentSlots = this.meta.state.baseModuleSlots;
        document.getElementById('hub-slots-badge').textContent = `${currentSlots}/${CONFIG.MAX_MODULE_SLOTS}`;
        const slotBtn = document.getElementById('btn-hub-upgrade-slot');
        const slotCard = document.getElementById('hub-slot-card');
        const slotStatus = document.getElementById('hub-slot-status-text');

        if (currentSlots >= CONFIG.MAX_MODULE_SLOTS) {
            slotBtn.disabled = true;
            slotBtn.textContent = 'МАКС. 5 СЛОТОВ ОТКРЫТО';
            slotCard.className = 'interactive-card card-owned p-2 rounded-lg border flex flex-col justify-between';
            slotStatus.innerHTML = '<span class="text-emerald-300 font-bold">Все 5 базовых слотов шасси разблокированы!</span>';
        } else {
            const nextSlot = currentSlots + 1;
            const cost = META_SLOT_COSTS[nextSlot];
            const canAffordSlot = bank >= cost;
            if (canAffordSlot) affordableCount++;
            slotBtn.disabled = !canAffordSlot;
            slotBtn.textContent = canAffordSlot
                ? `Купить ${nextSlot}-й слот (${cost} Руды)`
                : `Нужно ${cost} Руды (ещё ${cost - bank})`;
            slotCard.className = `interactive-card p-2 rounded-lg border flex flex-col justify-between ${
                canAffordSlot ? 'card-affordable' : 'card-locked'
            }`;
            slotStatus.innerHTML = canAffordSlot
                ? `<span class="text-amber-300 font-extrabold">ДОСТУПНО ДЛЯ ПРОКАЧКИ! (+1 слот навсегда)</span>`
                : `Больше слотов под модули. Накоплено: ${Math.min(100, Math.floor((bank / cost) * 100))}%`;
        }

        // 1.5. Отрисовка Глобальных Проектов Недр (новые постройки, позитивные события и положительные предметы)
        const projectsGrid = document.getElementById('hub-projects-grid');
        if (projectsGrid) {
            projectsGrid.innerHTML = '';
            const allProjects = Object.values(META_PROJECTS_CATALOG);
            const unlockedProjCount = this.meta.state.unlockedProjects.length;
            const projCountEl = document.getElementById('hub-projects-count');
            if (projCountEl) projCountEl.textContent = `${unlockedProjCount}/${allProjects.length} открыто`;

            allProjects.forEach((proj) => {
                const isOwned = this.meta.hasProject(proj.id);
                const canAfford = !isOwned && bank >= proj.cost;
                if (canAfford) affordableCount++;
                const pct = isOwned ? 100 : Math.min(100, Math.floor((bank / Math.max(1, proj.cost)) * 100));
                const missing = Math.max(0, proj.cost - bank);

                const pCard = document.createElement('div');
                pCard.className = `interactive-card p-2 rounded-lg border flex flex-col justify-between gap-1.5 ${
                    isOwned ? 'card-owned' : (canAfford ? 'card-affordable cursor-pointer' : 'card-locked')
                }`;

                const topDiv = document.createElement('div');
                const headRow = document.createElement('div');
                headRow.className = 'flex items-center gap-2';
                headRow.appendChild(this.art.createIconCanvasElement(this.art.textures[proj.iconKey] || this.art.icons.ore, 26, 'w-6 h-6'));

                const badgeHtml = isOwned
                    ? `<span class="text-[8px] font-extrabold bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">ОТКРЫТО</span>`
                    : (canAfford
                        ? `<span class="text-[8px] font-extrabold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400 badge-ready">ДОСТУПНО!</span>`
                        : `<span class="text-[8px] font-bold bg-slate-900 text-rose-300 px-1.5 py-0.5 rounded border border-slate-700">Ещё ${missing}</span>`);

                const titleCol = document.createElement('div');
                titleCol.className = 'min-w-0 flex-1';
                titleCol.innerHTML = `
                    <div class="flex items-center justify-between gap-1">
                        <span class="text-[8px] font-extrabold text-emerald-300 uppercase">${proj.category}</span>
                        ${badgeHtml}
                    </div>
                    <div class="text-[11px] font-extrabold text-white truncate mt-0.5">${proj.name}</div>
                `;
                headRow.appendChild(titleCol);
                topDiv.appendChild(headRow);

                const descP = document.createElement('p');
                descP.className = 'text-[9px] text-slate-300 mt-1 leading-tight';
                descP.textContent = proj.desc;
                topDiv.appendChild(descP);
                pCard.appendChild(topDiv);

                const botDiv = document.createElement('div');
                if (!isOwned) {
                    botDiv.innerHTML = `
                        <div class="w-full h-1 bg-slate-900 rounded overflow-hidden mb-1 border border-slate-800">
                            <div class="h-full ${canAfford ? 'bg-amber-400' : 'bg-emerald-500'}" style="width:${pct}%"></div>
                        </div>
                    `;
                }

                const pBtn = document.createElement('button');
                const buyProject = () => {
                    if (isOwned || !canAfford) return;
                    if (this.meta.spendOre(proj.cost)) {
                        this.meta.state.unlockedProjects.push(proj.id);
                        this.meta.save();
                        this.sound.playStationDock();
                        this.renderHubUI();
                    }
                };

                if (isOwned) {
                    pBtn.className = 'btn-game w-full py-1 rounded text-[9px] font-extrabold text-emerald-400';
                    pBtn.disabled = true;
                    pBtn.textContent = 'АКТИВНО В НЕДРАХ';
                } else if (canAfford) {
                    pBtn.className = 'btn-emerald w-full py-1 rounded text-[10px] font-extrabold';
                    pBtn.textContent = `Открыть проект (${proj.cost} Руды)`;
                    pBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        buyProject();
                    });
                    pCard.addEventListener('click', buyProject);
                } else {
                    pBtn.className = 'btn-game w-full py-1 rounded text-[9px] font-bold text-slate-400';
                    pBtn.disabled = true;
                    pBtn.textContent = `Копить: ${proj.cost} Руды (ещё ${missing})`;
                }

                botDiv.appendChild(pBtn);
                pCard.appendChild(botDiv);
                projectsGrid.appendChild(pCard);
            });
        }

        // 2. Сетка 3x3 чертежей модулей с пиксель-арт иконками, прогресс-баром и кликом по карточке
        const unlocksGrid = document.getElementById('hub-unlocks-grid');
        unlocksGrid.innerHTML = '';

        const allMods = Object.values(MODULES_CATALOG);
        const unlockedTotal = this.meta.state.unlockedModules.length;
        const unlockedBadge = document.getElementById('hub-unlocked-count');
        if (unlockedBadge) unlockedBadge.textContent = `${unlockedTotal}/${allMods.length} открыто`;

        allMods.forEach((mod) => {
            const rInfo = RARITY_TIERS[mod.rarity || 'COMMON'];
            const isUnlocked = this.meta.state.unlockedModules.includes(mod.id);
            const canAfford = !isUnlocked && bank >= mod.unlockCost;
            if (canAfford) affordableCount++;

            const pct = isUnlocked ? 100 : Math.min(100, Math.floor((bank / Math.max(1, mod.unlockCost)) * 100));
            const missingOre = Math.max(0, mod.unlockCost - bank);

            const card = document.createElement('div');
            card.className = `interactive-card p-2 rounded-lg border flex flex-col justify-between gap-1.5 ${
                isUnlocked
                    ? 'card-owned'
                    : (canAfford ? 'card-affordable cursor-pointer' : 'card-locked')
            }`;

            const topBlock = document.createElement('div');
            const headerLine = document.createElement('div');
            headerLine.className = 'flex items-center gap-2';
            headerLine.appendChild(this.art.createIconCanvasElement(this.art.moduleIcons[mod.id], 26, 'w-6 h-6'));

            const titleBox = document.createElement('div');
            titleBox.className = 'min-w-0 flex-1';

            const statusBadgeHTML = isUnlocked
                ? `<span class="text-[8px] font-extrabold bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">ОТКРЫТ</span>`
                : (canAfford
                    ? `<span class="text-[8px] font-extrabold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400 badge-ready">ДОСТУПНО!</span>`
                    : `<span class="text-[8px] font-bold bg-slate-900 text-rose-300 px-1.5 py-0.5 rounded border border-slate-700">Ещё ${missingOre}</span>`);

            titleBox.innerHTML = `
                <div class="flex items-center justify-between gap-1">
                    <span class="text-[8px] font-extrabold px-1 py-0.2 rounded border ${rInfo.badgeBg}">${rInfo.name}</span>
                    ${statusBadgeHTML}
                </div>
                <div class="text-[11px] font-extrabold ${rInfo.textColor} truncate mt-0.5">${mod.name}</div>
            `;
            headerLine.appendChild(titleBox);
            topBlock.appendChild(headerLine);

            const descEl = document.createElement('p');
            descEl.className = 'text-[9px] text-slate-300 mt-1 leading-tight';
            descEl.textContent = mod.descByLvl[0];
            topBlock.appendChild(descEl);
            card.appendChild(topBlock);

            // Нижний блок: шкала накопления + кнопка
            const bottomWrap = document.createElement('div');
            if (!isUnlocked) {
                bottomWrap.innerHTML = `
                    <div class="w-full h-1 bg-slate-900 rounded overflow-hidden mb-1 border border-slate-800">
                        <div class="h-full ${canAfford ? 'bg-amber-400' : 'bg-cyan-600'}" style="width:${pct}%"></div>
                    </div>
                `;
            }

            const btn = document.createElement('button');
            const unlockAction = () => {
                if (isUnlocked || !canAfford) return;
                if (this.meta.spendOre(mod.unlockCost)) {
                    this.meta.state.unlockedModules.push(mod.id);
                    this.meta.save();
                    this.sound.playStationDock();
                    this.renderHubUI();
                }
            };

            if (isUnlocked) {
                btn.className = 'btn-game w-full py-1 rounded text-[9px] font-extrabold text-emerald-400';
                btn.disabled = true;
                btn.textContent = 'В ПУЛЕ КАПСУЛ И СТАНЦИЙ';
            } else if (canAfford) {
                btn.className = 'btn-amber w-full py-1 rounded text-[10px] font-extrabold';
                btn.textContent = `Открыть чертеж (${mod.unlockCost} Руды)`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    unlockAction();
                });
                card.addEventListener('click', unlockAction);
            } else {
                btn.className = 'btn-game w-full py-1 rounded text-[9px] font-bold text-slate-400';
                btn.disabled = true;
                btn.textContent = `Цена: ${mod.unlockCost} Руды (не хватает ${missingOre})`;
            }

            bottomWrap.appendChild(btn);
            card.appendChild(bottomWrap);
            unlocksGrid.appendChild(card);
        });

        // Индикатор доступных покупок в шапке Ангара
        const counterBadge = document.getElementById('hub-affordable-counter');
        if (counterBadge) {
            if (affordableCount > 0) {
                counterBadge.textContent = `Доступно покупок: ${affordableCount}!`;
                counterBadge.classList.remove('hidden');
            } else {
                counterBadge.classList.add('hidden');
            }
        }
    }
}
