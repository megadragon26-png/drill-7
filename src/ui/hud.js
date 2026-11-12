/**
 * Верхняя панель ресурсов, слоты модулей, синергии и предупреждения.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { BIOMES } from '../data/biomes.js';
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { RARITY_TIERS } from '../data/rarities.js';
import { getLayerFuelDrain } from '../data/economy.js';

export class HudUI {
    updateHUD(dt = null) {
        if (typeof dt === 'number') {
            this.hudElapsed = (this.hudElapsed || 0) + dt;
            if (this.hudElapsed < 0.1) return;
        }
        this.hudElapsed = 0;
        if (!this.drill) return;
        const boostActive = this.drill.boostTimer > 0;
        const boostReady = this.state === 'PLAYING' && this.drill.boostCooldown <= 0 && this.drill.fuel >= CONFIG.BOOST_FUEL_COST;
        const boostLabel = boostActive ? `ФОРСАЖ ${this.drill.boostTimer.toFixed(1)}с` : (this.drill.boostCooldown > 0 ? `Через ${Math.ceil(this.drill.boostCooldown)}с` : (this.drill.fuel < CONFIG.BOOST_FUEL_COST ? 'НУЖНО 6т' : 'ФОРСАЖ · 6т'));
        const boostButton = document.getElementById('btn-boost');
        const touchBoost = document.getElementById('touch-boost');
        boostButton.textContent = boostLabel + (boostReady ? ' [Space]' : '');
        document.getElementById('touch-boost-label').textContent = boostLabel;
        boostButton.disabled = !boostReady;
        touchBoost.disabled = !boostReady;
        touchBoost.classList.toggle('boost-active', boostActive);
        document.getElementById('flow-status').textContent = this.drill.flowStacks ? `РИТМ ${this.drill.flowStacks}/5 · +${this.drill.flowStacks * 8}%` : '';
        touchBoost.title = `Ритм ${this.drill.flowStacks}/5. Форсаж: ${CONFIG.BOOST_FUEL_COST} топлива, +${CONFIG.BOOST_HEAT} нагрева.`;
        const findingsButton = document.getElementById('btn-modifier-inventory');
        findingsButton.textContent = `Находки: ${this.drill.modifiers.length}`;
        findingsButton.disabled = this.state !== 'PLAYING';

        const hullPct = Math.max(0, Math.min(100, (this.drill.hull / this.drill.maxHull) * 100));
        const fuelPct = Math.max(0, Math.min(100, (this.drill.fuel / this.drill.maxFuel) * 100));
        const heatPct = Math.max(0, Math.min(100, this.drill.heat));

        document.getElementById('hull-text').textContent = `${Math.ceil(this.drill.hull)}/${this.drill.maxHull}`;
        document.getElementById('hull-bar').style.width = `${hullPct}%`;

        const currentDrainPerSec = getLayerFuelDrain(this.currentLayerNumber) * this.drill.getFuelConsumptionMultiplier();
        const fuelRateEl = document.getElementById('fuel-rate-text');
        if (fuelRateEl) {
            if (this.drill.chronoBuffTimer > 0) {
                fuelRateEl.textContent = `(ХРОНО ${this.drill.chronoBuffTimer.toFixed(1)}с: 0/с)`;
            } else {
                fuelRateEl.textContent = `(-${currentDrainPerSec.toFixed(1)}/с)`;
            }
        }

        document.getElementById('fuel-text').textContent = `${Math.ceil(this.drill.fuel)}/${this.drill.maxFuel}`;
        document.getElementById('fuel-bar').style.width = `${fuelPct}%`;

        document.getElementById('heat-text').textContent = `${Math.round(heatPct)}%`;
        document.getElementById('heat-bar').style.width = `${heatPct}%`;

        const biome = BIOMES[this.currentBiomeIndex] || BIOMES[0];
        document.getElementById('biome-text').textContent = biome.name;

        const distToStation = Math.max(0, (CONFIG.LAYER_ROWS - 2) - this.drill.gridY);
        const toolsButton = document.getElementById('btn-mobile-tools');
        toolsButton.textContent = `⋯ ${distToStation}м`;
        toolsButton.setAttribute('aria-label', `Меню игры, до станции ${distToStation} метров`);
        document.getElementById('hud-heat-box').classList.toggle('resource-critical', this.drill.isOverheated() || heatPct >= 95);
        document.getElementById('station-distance-text').textContent = `До Станции: ${distToStation} м`;
        document.getElementById('cargo-ore-text').textContent = `${this.drill.ore}`;
        document.getElementById('cargo-ore-text').parentElement.title = `Выход руды: ${Math.round(this.drill.getOreRecoveryFactor() * 100)}%. Новый слой восстанавливает выход. Продажа возвращает половину вложенной руды.`;

        // Живая панель слотов модулей (на мобильных — компактные значки без длинных подписей)
        const modBar = document.getElementById('hud-modules-bar');
        modBar.innerHTML = '';
        for (let i = 0; i < this.drill.moduleSlots; i++) {
            const modObj = this.drill.modules[i];
            const item = document.createElement('div');
            if (modObj && MODULES_CATALOG[modObj.id]) {
                const spec = MODULES_CATALOG[modObj.id];
                const rarityInfo = RARITY_TIERS[spec.rarity || 'COMMON'];
                let cdPct = 100;
                if (spec.isActiveTimer) {
                    const maxCd = spec.cooldowns[modObj.level - 1];
                    if (modObj.id === 'TITAN_SHIELD') {
                        cdPct = this.drill.shieldReady ? 100 : Math.round(((maxCd - modObj.timer) / maxCd) * 100);
                    } else {
                        cdPct = Math.round(((maxCd - modObj.timer) / maxCd) * 100);
                    }
                }
                item.className = 'w-8 sm:w-24 bg-[#080b12] px-1 py-0.5 sm:px-1.5 rounded border border-cyan-500/50 flex items-center gap-1';
                item.title = `[${rarityInfo.name}] ${spec.name} (Ур.${modObj.level}): ${spec.descByLvl[modObj.level - 1]}`;
                const iconEl = this.art.createIconCanvasElement(this.art.moduleIcons[modObj.id], 16, 'w-3.5 h-3.5 sm:w-4 sm:h-4 border-0');
                const rightCol = document.createElement('div');
                rightCol.className = 'flex-1 min-w-0';
                rightCol.innerHTML = `
                    <div class="flex justify-between items-center text-[7px] sm:text-[8px] font-extrabold">
                        <span class="${rarityInfo.textColor} truncate hidden sm:inline">${spec.shortName}</span>
                        <span class="text-cyan-300">${modObj.level}</span>
                    </div>
                    <div class="w-full h-1 bg-slate-800 rounded overflow-hidden mt-0.5">
                        <div class="h-full bg-cyan-400" style="width:${Math.max(0, Math.min(100, cdPct))}%"></div>
                    </div>
                `;
                item.appendChild(iconEl);
                item.appendChild(rightCol);
            } else {
                item.className = 'w-5 sm:w-14 bg-[#080b12] px-1 py-0.5 sm:px-1.5 sm:py-1 rounded border border-slate-800 text-center text-[8px] sm:text-[9px] font-bold text-slate-500';
                item.innerHTML = '<span class="hidden sm:inline">ПУСТО</span><span class="sm:hidden">·</span>';
            }
            modBar.appendChild(item);
        }

        // Индикатор активных комбо-синергий в шапке
        const synBar = document.getElementById('hud-synergies-bar');
        if (synBar) {
            const activeSynergies = this.drill.getActiveSynergies();
            if (activeSynergies.length > 0) {
                synBar.className = 'hidden sm:flex flex-wrap items-center gap-1 bg-amber-950/70 px-2 py-1 rounded border border-amber-400/70 max-w-full';
                synBar.innerHTML = `<span class="text-[9px] font-extrabold text-amber-300 uppercase">Синергии (${activeSynergies.length}):</span>`;
                activeSynergies.forEach((syn) => {
                    const tag = document.createElement('span');
                    tag.className = 'text-[9px] font-extrabold text-yellow-200 bg-amber-900/80 px-1.5 py-0.5 rounded border border-amber-400/40';
                    tag.title = syn.desc;
                    tag.textContent = syn.name;
                    synBar.appendChild(tag);
                });
            } else {
                synBar.className = 'hidden';
            }
        }
    }
}
