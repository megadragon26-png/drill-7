/**
 * Подземная станция: торговля, сервис, банк и выбор маршрута.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { BIOMES } from '../data/biomes.js';
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { CHASSIS_UPGRADES } from '../data/progression.js';
import { RARITY_TIERS } from '../data/rarities.js';
import { getServiceQuote } from '../data/economy.js';

export class StationUI {
    setStationTab(tab) {
        this.stationTab = ['mods', 'serv', 'route'].includes(tab) ? tab : 'mods';
        for (const [id, section] of [['st-sec-installed', 'mods'], ['st-sec-shop', 'mods'], ['st-sec-service', 'serv'], ['st-sec-route', 'route']]) {
            document.getElementById(id).classList.toggle('mobile-tab-hidden', this.stationTab !== section);
        }
        for (const name of ['mods', 'serv', 'route']) document.getElementById(`st-mob-tab-${name}`).setAttribute('aria-selected', String(name === this.stationTab));
    }

    openStationModal() {
        this.setStationTab('mods');
        this.state = 'STATION';
        this.keys = { left: false, right: false, down: false };
        this.drill.heat = 0;
        this.drill.cryoSlowTimer = 0;
        this.stationRerollCount = 0;
        this.stationServiceCount = 0;

        document.getElementById('station-proximity-banner').classList.add('hidden');
        document.getElementById('overheat-banner').classList.add('hidden');
        document.getElementById('damage-alert-banner').classList.add('hidden');
        document.getElementById('modal-station').classList.remove('hidden');
        document.getElementById('station-title').textContent = `ПОДЗЕМНАЯ СТАНЦИЯ #${this.currentLayerNumber}`;

        // Подготовка альтернативных вариантов следующего слоя (развилки на Слоях 2, 3, 4, 5 и в Бездне)
        const nextTier = this.currentLayerNumber + 1;
        if (nextTier <= 6) {
            this.nextRouteOptions = this.getBiomesForTier(nextTier);
        } else {
            // В Бесконечной Бездне после 6-го слоя даем выбор между 2 случайными высокоуровневыми биомами
            const deepPool = BIOMES.filter(b => b.depthTier >= 3);
            const shuffled = [...deepPool].sort(() => Math.random() - 0.5);
            this.nextRouteOptions = shuffled.slice(0, 2);
        }
        this.selectedNextBiomeIndex = this.nextRouteOptions[0].index;

        this.rollStationShop();
        this.renderStationUI();
    }

    rollStationShop() {
        const pool = [...this.meta.state.unlockedModules];
        this.stationShopList = this.pickWeightedModules(pool, 3);
    }

    stationRerollShop() {
        if (this.state !== 'STATION') return;
        const rerollCosts = [15, 30, 50, 75];
        const cost = rerollCosts[Math.min(this.stationRerollCount, rerollCosts.length - 1)];
        if (this.drill.ore < cost) return;
        this.drill.ore -= cost;
        this.stationRerollCount++;
        this.rollStationShop();
        this.sound.playBlockBreak(false);
        this.renderStationUI();
        this.updateHUD();
    }

    stationBuyRunSlot() {
        if (this.state !== 'STATION') return;
        if (this.drill.moduleSlots >= CONFIG.MAX_MODULE_SLOTS) return;
        const cost = 140 + (this.drill.moduleSlots - 2) * 95;
        if (this.drill.ore < cost) return;
        this.drill.ore -= cost;
        this.drill.moduleSlots++;
        this.sound.playStationDock();
        this.renderStationUI();
        this.updateHUD();
    }

    renderStationUI() {
        document.getElementById('station-cargo-ore').textContent = `${this.drill.ore} Руды`;
        document.getElementById('station-bank-ore').textContent = `${this.meta.state.bankOre} Руды`;
        document.getElementById('station-slots-badge').textContent =
            `Слоты: ${this.drill.modules.length}/${this.drill.moduleSlots}`;

        const slotBtn = document.getElementById('btn-station-buy-slot');
        if (this.drill.moduleSlots >= CONFIG.MAX_MODULE_SLOTS) {
            slotBtn.disabled = true;
            slotBtn.textContent = 'МАКС. 5 СЛОТОВ';
        } else {
            const slotCost = 140 + (this.drill.moduleSlots - 2) * 95;
            slotBtn.disabled = this.drill.ore < slotCost;
            slotBtn.textContent = `+1 Слот (${slotCost} Руды)`;
        }

        // 1. Отрисовка установленных слотов (с иконками, редкостью, кнопками Апгрейда Ур.1->3 и возврата 50% вложений)
        const slotsGrid = document.getElementById('station-installed-slots');
        slotsGrid.innerHTML = '';
        for (let i = 0; i < this.drill.moduleSlots; i++) {
            const m = this.drill.modules[i];
            const box = document.createElement('div');
            if (m) {
                const spec = MODULES_CATALOG[m.id];
                const rInfo = RARITY_TIERS[spec.rarity || 'COMMON'];
                const canUpg = m.level < 3;
                const upgCost = canUpg ? spec.upgradeCosts[m.level - 1] : 0;
                const canAffordUpg = canUpg && this.drill.ore >= upgCost;
                const sellVal = this.drill.getModuleRefund(m.id);
                const expectedLevel = m.level;

                box.className = `interactive-card p-1.5 rounded border flex flex-col justify-between gap-1 ${
                    canAffordUpg ? 'card-affordable' : 'bg-[#131a2c] border-cyan-500/50'
                }`;

                const topLine = document.createElement('div');
                topLine.className = 'flex items-center justify-between gap-1 text-[10px] font-extrabold';
                const leftInfo = document.createElement('div');
                leftInfo.className = 'flex items-center gap-1 min-w-0';
                leftInfo.appendChild(this.art.createIconCanvasElement(this.art.moduleIcons[m.id], 18, 'w-4 h-4'));
                const nameEl = document.createElement('span');
                nameEl.className = `${rInfo.textColor} truncate`;
                nameEl.textContent = spec.shortName;
                leftInfo.appendChild(nameEl);

                const lvlEl = document.createElement('span');
                lvlEl.className = 'text-cyan-300 shrink-0';
                lvlEl.textContent = `У${m.level}`;

                topLine.appendChild(leftInfo);
                topLine.appendChild(lvlEl);
                box.appendChild(topLine);

                const btnRow = document.createElement('div');
                btnRow.className = 'flex gap-1 mt-0.5';

                const upgBtn = document.createElement('button');
                upgBtn.className = 'btn-emerald flex-1 py-0.5 px-1 rounded text-[9px] font-extrabold';
                if (canUpg) {
                    upgBtn.disabled = !canAffordUpg;
                    upgBtn.textContent = canAffordUpg ? `Ур.${m.level + 1} (${upgCost})` : `Нужно ${upgCost}`;
                    upgBtn.addEventListener('click', () => {
                        if (this.state === 'STATION' && this.drill.getModuleLevel(m.id) === expectedLevel && this.drill.ore >= upgCost && this.drill.upgradeModule(m.id)) {
                            this.drill.ore -= upgCost;
                            this.sound.playBlockBreak(true);
                            this.renderStationUI();
                            this.updateHUD();
                        }
                    });
                } else {
                    upgBtn.disabled = true;
                    upgBtn.textContent = 'МАКС';
                }

                const sellBtn = document.createElement('button');
                sellBtn.className = 'btn-game py-0.5 px-1.5 rounded text-[9px] font-bold text-rose-300';
                sellBtn.title = `Вернуть за модуль +${sellVal} Руды`;
                sellBtn.textContent = `+${sellVal}`;
                sellBtn.addEventListener('click', () => {
                    if (this.state !== 'STATION') return;
                    const refund = this.drill.uninstallModule(m.id);
                    this.drill.ore += refund;
                    this.sound.playBlockBreak(false);
                    this.renderStationUI();
                    this.updateHUD();
                });

                btnRow.appendChild(upgBtn);
                btnRow.appendChild(sellBtn);
                box.appendChild(btnRow);
            } else {
                box.className = 'bg-[#0c101b] p-2 rounded border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500';
                box.textContent = `Слот #${i + 1} пуст`;
            }
            slotsGrid.appendChild(box);
        }

        // Отрисовка активных и потенциальных комбо-синергий на станции
        const synBox = document.getElementById('station-synergies-box');
        if (synBox) {
            const activeSyns = this.drill.getActiveSynergies();
            if (activeSyns.length > 0) {
                synBox.classList.remove('hidden');
                synBox.innerHTML = `<span class="text-[9px] font-extrabold text-amber-300 uppercase">Активные Синергии:</span>`;
                activeSyns.forEach((syn) => {
                    const badge = document.createElement('div');
                    badge.className = 'text-[9px] bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded border border-amber-400/60 font-bold';
                    badge.innerHTML = `<strong class="text-yellow-300">${syn.name}:</strong> ${syn.desc}`;
                    synBox.appendChild(badge);
                });
            } else {
                synBox.classList.add('hidden');
            }
        }

        // 2. Витрина 3 модулей с бейджами редкости, пиксельными иконками и индикацией доступности
        const rerollCosts = [15, 30, 50, 75];
        const rCost = rerollCosts[Math.min(this.stationRerollCount, rerollCosts.length - 1)];
        const rerollBtn = document.getElementById('btn-station-reroll');
        rerollBtn.disabled = this.drill.ore < rCost;
        rerollBtn.textContent = `Обновить (${rCost} Руды)`;

        const shopEl = document.getElementById('station-shop-offers');
        shopEl.innerHTML = '';
        this.stationShopList.forEach((modId) => {
            const spec = MODULES_CATALOG[modId];
            if (!spec) return;
            const rInfo = RARITY_TIERS[spec.rarity || 'COMMON'];
            const existing = this.drill.getModuleObj(modId);
            const expectedLevel = existing?.level || 0;
            const isInstalled = !!existing;
            const hasSlot = this.drill.modules.length < this.drill.moduleSlots;

            let actionCost = spec.buyCost;
            let btnLabel = `Купить (${actionCost})`;
            let canBuy = this.drill.ore >= actionCost && hasSlot;
            let statusTag = '';

            if (isInstalled) {
                if (existing.level < 3) {
                    actionCost = spec.upgradeCosts[existing.level - 1];
                    canBuy = this.drill.ore >= actionCost;
                    btnLabel = canBuy ? `Ур.${existing.level + 1} (${actionCost})` : `Цена: ${actionCost}`;
                    statusTag = canBuy
                        ? `<span class="text-[8px] font-extrabold bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40 badge-ready">АПГРЕЙД ДОСТУПЕН</span>`
                        : `<span class="text-[8px] font-bold text-rose-300">Ещё ${actionCost - this.drill.ore} Руды</span>`;
                } else {
                    btnLabel = 'МАКС УР.3';
                    canBuy = false;
                    statusTag = `<span class="text-[8px] font-extrabold text-cyan-300">МАКСИМУМ</span>`;
                }
            } else if (!hasSlot) {
                btnLabel = 'Нет слота';
                canBuy = false;
                statusTag = `<span class="text-[8px] font-bold text-amber-300">Освободите слот</span>`;
            } else {
                statusTag = canBuy
                    ? `<span class="text-[8px] font-extrabold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/50 badge-ready">ДОСТУПНО!</span>`
                    : `<span class="text-[8px] font-bold text-rose-300">Ещё ${actionCost - this.drill.ore} Руды</span>`;
            }

            const nextLvl = isInstalled ? Math.min(3, existing.level + 1) : 1;
            const row = document.createElement('div');
            row.className = `interactive-card p-1.5 rounded border flex items-center justify-between gap-2 ${
                canBuy ? 'card-affordable cursor-pointer' : 'card-locked'
            }`;

            const leftPart = document.createElement('div');
            leftPart.className = 'flex items-center gap-2 min-w-0 flex-1';
            leftPart.appendChild(this.art.createIconCanvasElement(this.art.moduleIcons[modId], 26, 'w-6 h-6'));

            const textWrap = document.createElement('div');
            textWrap.className = 'min-w-0 flex-1';
            textWrap.innerHTML = `
                <div class="flex items-center justify-between gap-1 flex-wrap">
                    <div class="flex items-center gap-1 min-w-0">
                        <span class="text-[8px] font-extrabold px-1 py-0.2 rounded border ${rInfo.badgeBg}">${rInfo.name}</span>
                        <span class="text-[11px] font-extrabold ${rInfo.textColor} truncate">${spec.name}</span>
                    </div>
                    ${statusTag}
                </div>
                <div class="text-[9px] text-slate-300 leading-tight mt-0.5">${spec.descByLvl[nextLvl - 1]}</div>
            `;
            leftPart.appendChild(textWrap);
            row.appendChild(leftPart);

            const btn = document.createElement('button');
            btn.className = isInstalled ? 'btn-emerald px-2 py-1 rounded text-[10px] font-extrabold shrink-0' : 'btn-amber px-2 py-1 rounded text-[10px] font-extrabold shrink-0';
            btn.disabled = !canBuy;
            btn.textContent = btnLabel;

            const buyHandler = () => {
                if (!canBuy || this.state !== 'STATION' || this.drill.getModuleLevel(modId) !== expectedLevel) return;
                if (this.drill.ore >= actionCost && this.drill.installModule(modId, actionCost)) {
                    this.drill.ore -= actionCost;
                    this.sound.playBlockBreak(true);
                    this.renderStationUI();
                    this.updateHUD();
                }
            };
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                buyHandler();
            });
            if (canBuy) row.addEventListener('click', buyHandler);

            row.appendChild(btn);
            shopEl.appendChild(row);
        });

        // 3. Сервис и Лимитированная Модернизация Шасси (Ур. 0..6) с подсветкой доступности
        const refuel = getServiceQuote(this.drill.fuel, this.drill.maxFuel, this.currentLayerNumber);
        const repair = getServiceQuote(this.drill.hull, this.drill.maxHull, this.currentLayerNumber);
        document.getElementById('cost-refuel').textContent = `${refuel.cost} Руды`;
        document.getElementById('cost-repair').textContent = `${repair.cost} Руды`;
        document.getElementById('service-refuel-amount').textContent = `+${refuel.amount} Топл.`;
        document.getElementById('service-repair-amount').textContent = `+${repair.amount} HP`;
        document.getElementById('btn-station-refuel').disabled = this.drill.ore < refuel.cost || !refuel.amount;
        document.getElementById('btn-station-repair').disabled = this.drill.ore < repair.cost || !repair.amount;

        const renderChassisRow = (key, cardId, lvlElId, statusElId, btnElId, defaultDesc) => {
            const cfg = CHASSIS_UPGRADES[key];
            const curLvl = this.drill.chassisLevels[key];
            const cardEl = document.getElementById(cardId);
            const statusEl = document.getElementById(statusElId);
            document.getElementById(lvlElId).textContent = `[Ур.${curLvl}/${cfg.maxLevel}]`;
            const btn = document.getElementById(btnElId);

            if (curLvl >= cfg.maxLevel) {
                btn.disabled = true;
                btn.textContent = 'МАКС';
                cardEl.className = 'interactive-card card-owned px-2 py-1 rounded border flex items-center justify-between gap-1.5';
                statusEl.innerHTML = `<span class="text-emerald-300 font-bold">Максимальный уровень!</span>`;
            } else {
                const cost = cfg.costs[curLvl];
                const affordable = this.drill.ore >= cost;
                btn.disabled = !affordable;
                btn.textContent = `${cost} Руды`;
                cardEl.className = `interactive-card px-2 py-1 rounded border flex items-center justify-between gap-1.5 ${
                    affordable ? 'card-affordable' : 'card-locked'
                }`;
                statusEl.innerHTML = affordable
                    ? `<span class="text-amber-300 font-bold">Доступно: ${defaultDesc}</span>`
                    : `<span class="text-slate-400">${defaultDesc} (ещё ${cost - this.drill.ore})</span>`;
            }
        };
        renderChassisRow('torque', 'card-upg-torque', 'lvl-torque', 'status-upg-torque', 'btn-upg-torque', '+12% скорость');
        renderChassisRow('tank', 'card-upg-tank', 'lvl-tank', 'status-upg-tank', 'btn-upg-tank', '+25 макс. топл.');
        renderChassisRow('armor', 'card-upg-armor', 'lvl-armor', 'status-upg-armor', 'btn-upg-armor', '+25 макс. жизней');

        document.getElementById('btn-evac-half').disabled = this.drill.ore <= 0;
        document.getElementById('btn-evac-all').disabled = this.drill.ore <= 0;

        // 4. Отрисовка выбора альтернативного маршрута на следующий слой
        const routeChoicesEl = document.getElementById('station-route-choices');
        if (routeChoicesEl && this.nextRouteOptions) {
            routeChoicesEl.innerHTML = '';
            const selectedBiomeObj = BIOMES[this.selectedNextBiomeIndex] || this.nextRouteOptions[0];
            document.getElementById('next-biome-preview').textContent =
                `Выбран маршрут: ${selectedBiomeObj.name}`;

            const descendBtn = document.getElementById('btn-station-descend');
            if (descendBtn) {
                descendBtn.textContent = `ОТПРАВИТЬСЯ В «${selectedBiomeObj.shortName.toUpperCase()}» (${selectedBiomeObj.rows} М) ▼`;
            }

            this.nextRouteOptions.forEach((b) => {
                const isPicked = b.index === this.selectedNextBiomeIndex;
                const card = document.createElement('div');
                card.className = `interactive-card p-2 rounded-lg border cursor-pointer flex items-start gap-2 ${
                    isPicked ? 'card-affordable' : 'bg-[#101726] border-slate-700/80 hover:border-cyan-400/60'
                }`;

                const iconTex = this.art.textures[b.iconTex || 'DIRT'] || this.art.textures.DIRT;
                card.appendChild(this.art.createIconCanvasElement(iconTex, 28, 'w-7 h-7 mt-0.5'));

                const info = document.createElement('div');
                info.className = 'min-w-0 flex-1';
                info.innerHTML = `
                    <div class="flex items-center justify-between gap-1">
                        <span class="text-[11px] font-extrabold ${isPicked ? 'text-amber-300' : 'text-white'} truncate">${b.name}</span>
                        <span class="text-[8px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                            isPicked ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }">${isPicked ? 'ВЫБРАН' : 'ВЫБРАТЬ'}</span>
                    </div>
                    <div class="text-[9px] text-rose-300 mt-0.5 leading-tight"><strong>Опасности:</strong> ${b.hazardSummary || 'Высокая плотность ловушек'}</div>
                    <div class="text-[9px] text-emerald-300 mt-0.5 leading-tight"><strong>Особенности:</strong> ${b.featureSummary || 'Редкие ресурсы глубины'}</div>
                `;
                card.appendChild(info);

                card.addEventListener('click', () => {
                    this.selectedNextBiomeIndex = b.index;
                    this.sound.playBlockBreak(false);
                    this.renderStationUI();
                });

                routeChoicesEl.appendChild(card);
            });
        }
    }

    stationBuyRefuel() {
        if (this.state !== 'STATION') return false;
        const { amount, cost } = getServiceQuote(this.drill.fuel, this.drill.maxFuel, this.currentLayerNumber);
        if (!amount || this.drill.ore < cost) return false;
        this.drill.ore -= cost;
        this.stationServiceCount++;
        this.drill.addFuel(amount);
        this.sound.playBlockBreak(true);
        this.renderStationUI();
        this.updateHUD();
        return true;
    }

    stationBuyRepair() {
        if (this.state !== 'STATION') return false;
        const { amount, cost } = getServiceQuote(this.drill.hull, this.drill.maxHull, this.currentLayerNumber);
        if (!amount || this.drill.ore < cost) return false;
        this.drill.ore -= cost;
        this.stationServiceCount++;
        this.drill.hull = Math.min(this.drill.maxHull, this.drill.hull + amount);
        this.sound.playBlockBreak(true);
        this.renderStationUI();
        this.updateHUD();
        return true;
    }

    stationUpgradeChassis(key) {
        if (this.state !== 'STATION') return;
        const cfg = CHASSIS_UPGRADES[key];
        if (!cfg) return;
        const curLvl = this.drill.chassisLevels[key];
        if (curLvl >= cfg.maxLevel) return;
        const cost = cfg.costs[curLvl];
        if (this.drill.ore < cost) return;

        this.drill.ore -= cost;
        this.drill.chassisLevels[key]++;

        if (key === 'tank') {
            this.drill.maxFuel += cfg.fuelBonusPerLevel;
            this.drill.fuel = Math.min(this.drill.maxFuel, this.drill.fuel + cfg.fuelBonusPerLevel);
        } else if (key === 'armor') {
            this.drill.maxHull += cfg.hullBonusPerLevel;
            this.drill.hull = Math.min(this.drill.maxHull, this.drill.hull + cfg.hullBonusPerLevel);
        }

        this.sound.playStationDock();
        this.renderStationUI();
        this.updateHUD();
    }

    stationSendToBank(ratio) {
        if (this.state !== 'STATION' || !Number.isFinite(ratio) || ratio <= 0 || ratio > 1) return;
        const sendAmount = Math.ceil(this.drill.ore * ratio);
        if (sendAmount <= 0) return;
        this.drill.ore -= sendAmount;
        this.meta.depositOre(sendAmount);
        this.sound.playStationDock();
        this.renderStationUI();
        this.updateHUD();
    }
}
