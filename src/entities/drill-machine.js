/**
 * Состояние бура, ресурсы, модули, синергии и формулы характеристик.
 */
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { CHASSIS_UPGRADES } from '../data/progression.js';
import { SYNERGIES_CATALOG } from '../data/synergies.js';
import { MODIFIERS_CATALOG } from '../data/modifiers.js';
import { getOreAllowance, getLayerDangerScale } from '../data/economy.js';

export class DrillMachine {
    constructor(startX, startY, baseSlots) {
        this.gridX = startX;
        this.gridY = startY;
        this.visualX = startX;
        this.visualY = startY;

        this.maxFuel = CONFIG.BASE_MAX_FUEL;
        this.fuel = this.maxFuel;

        this.maxHull = CONFIG.BASE_MAX_HULL;
        this.hull = this.maxHull;

        this.heat = 0;
        this.baseDrillPower = CONFIG.BASE_DRILL_POWER;

        // Уровни модернизации шасси (строгий лимит 0..4)
        this.chassisLevels = {
            torque: 0,
            tank: 0,
            armor: 0
        };

        // Новый корпус без руды; стартовое оборудование выдаёт RunLifecycle.
        this.ore = 0;
        this.oreLayer = 1;
        this.oreRawExtracted = 0;
        this.oreRecoveryCarry = 0;
        this.layerOreEarned = 0;

        // Установленные модули: со старта пусто (0 модулей)
        this.moduleSlots = baseSlots;
        this.modules = [];
        this.modifiers = [];
        this.oreCapacitorCharge = 0;
        this.excavatorCharge = 0;

        // Энергетический щит (от модуля TITAN_SHIELD)
        this.shieldReady = false;
        // Накопитель потраченного топлива для Нано-Ремкомплекта «Феникс»
        this.fuelSpentAccumulator = 0;
        // Внутренний кулдаун ответной волны брони «Бастион»
        this.bastionWaveCooldown = 0;
        // Таймер баффа Хроно-Сферы (останавливает расход топлива и ускоряет системы)
        this.chronoBuffTimer = 0;
        // Таймер обледенения привода от Крио-Осколков в Мерзлотных Крио-Шахтах (Слой 2Б)
        this.cryoSlowTimer = 0;

        // Статистика урона (включая тектонические катаклизмы)
        this.damageHistory = { gas: 0, rock: 0, lava: 0, tectonic: 0 };

        this.facing = 'down';
        this.isDrilling = false;
        this.drillAnimPhase = 0;
        this.moveTimer = 0;
        this.boostTimer = 0;
        this.boostCooldown = 0;
        this.flowStacks = 0;
        this.flowTimer = 0;
        this.repairProcTimer = 0;
        this.repairProcPeak = 0;
        this.overheatDamageTimer = 0;
        this.worldDangerScale = 1;
        this.droneOrbitAngle = 0;
    }

    hasModifier(id) {
        return this.modifiers.includes(id);
    }

    beginBoost(gameRef = null) {
        if (this.boostCooldown > 0 || this.boostTimer > 0 || this.fuel < CONFIG.BOOST_FUEL_COST) return false;
        this.consumeFuel(CONFIG.BOOST_FUEL_COST, gameRef);
        this.addHeat(CONFIG.BOOST_HEAT);
        this.boostTimer = CONFIG.BOOST_DURATION;
        this.boostCooldown = CONFIG.BOOST_COOLDOWN;
        return true;
    }

    registerDigFlow() {
        this.flowStacks = Math.min(CONFIG.FLOW_MAX_STACKS, this.flowStacks + 1);
        this.flowTimer = CONFIG.FLOW_DURATION;
    }

    updateDriveTimers(dt) {
        this.repairProcTimer = Math.max(0, this.repairProcTimer - dt);
        this.boostTimer = Math.max(0, this.boostTimer - dt);
        this.boostCooldown = Math.max(0, this.boostCooldown - dt);
        this.flowTimer = Math.max(0, this.flowTimer - dt);
        if (this.flowTimer === 0) this.flowStacks = 0;
    }

    installModifier(id) {
        if (!MODIFIERS_CATALOG[id] || this.hasModifier(id)) return false;
        this.modifiers.push(id);
        if (id === 'RESERVE_TANK') this.maxFuel += 25;
        if (id === 'HULL_PLATING') { this.maxHull += 25; this.hull += 25; }
        return true;
    }

    getActiveSynergies() {
        return SYNERGIES_CATALOG.filter(syn => syn.check(this));
    }

    tryRepairHull(amount) {
        if (this.hull <= 0 || !Number.isFinite(amount) || amount <= 0) return 0;
        if (this.repairProcTimer <= 0) this.repairProcPeak = 0;
        const repaired = Math.min(Math.max(0, amount - this.repairProcPeak), this.maxHull - this.hull);
        this.hull += repaired;
        if (repaired > 0) {
            if (this.repairProcTimer <= 0) this.repairProcTimer = 1.25;
            this.repairProcPeak += repaired;
        }
        return repaired;
    }

    hasSynergy(synId) {
        return SYNERGIES_CATALOG.some(syn => syn.id === synId && syn.check(this));
    }

    getModuleObj(modId) {
        return this.modules.find(m => m.id === modId) || null;
    }

    hasModule(modId) {
        return !!this.getModuleObj(modId);
    }

    getModuleLevel(modId) {
        const m = this.getModuleObj(modId);
        return m ? m.level : 0;
    }

    installModule(modId, paidOre = null) {
        const spec = MODULES_CATALOG[modId];
        if (!spec || (paidOre !== null && (!Number.isFinite(paidOre) || paidOre < 0))) return false;
        const existing = this.getModuleObj(modId);
        if (existing) {
            return this.upgradeModule(modId, paidOre);
        }
        if (this.modules.length >= this.moduleSlots) return false;
        const initTimer = spec.isActiveTimer ? spec.cooldowns[0] * 0.5 : 0;
        this.modules.push({ id: modId, level: 1, timer: initTimer, paidOre: paidOre ?? spec.buyCost });
        if (modId === 'TITAN_SHIELD') {
            this.shieldReady = true;
        }
        return true;
    }

    upgradeModule(modId, paidOre = null) {
        const m = this.getModuleObj(modId);
        if (!m || m.level >= 3) return false;
        if (paidOre !== null && (!Number.isFinite(paidOre) || paidOre < 0)) return false;
        m.paidOre = (m.paidOre || 0) + (paidOre ?? MODULES_CATALOG[modId].upgradeCosts[m.level - 1]);
        m.level++;
        if (modId === 'TITAN_SHIELD') this.shieldReady = true;
        return true;
    }

    getModuleRefund(modId) {
        const module = this.getModuleObj(modId);
        return Math.floor((module?.paidOre || 0) * 0.5);
    }

    uninstallModule(modId) {
        const idx = this.modules.findIndex(m => m.id === modId);
        if (idx === -1) return 0;
        const refund = this.getModuleRefund(modId);
        this.modules.splice(idx, 1);
        if (modId === 'TITAN_SHIELD') this.shieldReady = false;
        return refund;
    }

    isOverheated() {
        if (this.getModuleLevel('THERMAL_AEGIS') >= 3) {
            return false;
        }
        return this.heat >= CONFIG.OVERHEAT_THRESHOLD;
    }

    getCooldownHasteMultiplier() {
        let haste = 1.0;
        if (this.hasModifier('HOT_CLOCK') && this.heat >= 40) haste += 0.25;
        if (this.hasModifier('COLD_CLOCK') && this.heat <= 25) haste += 0.20;
        const aegisLvl = this.getModuleLevel('THERMAL_AEGIS');
        if (aegisLvl > 0 && this.heat >= 30) {
            haste += MODULES_CATALOG.THERMAL_AEGIS.cdrBonus[aegisLvl - 1];
        }
        if (this.chronoBuffTimer > 0) {
            haste += 1.0; // Вдвое более быстрая перезарядка под эффектом Хроно-Сферы!
        }
        return haste;
    }

    consumeFuel(amount, gameRef = null) {
        if (this.chronoBuffTimer > 0) return; // Под действием Хроно-Сферы топливо НЕ расходуется!
        if (!Number.isFinite(amount) || amount <= 0) return;
        const spent = Math.min(this.fuel, amount);
        this.fuel -= spent;
        const naniteLvl = this.getModuleLevel('FUEL_NANITES');
        if (naniteLvl > 0) {
            this.fuelSpentAccumulator += spent;
            while (this.fuelSpentAccumulator >= 12.0) {
                this.fuelSpentAccumulator -= 12.0;
                const healAmt = MODULES_CATALOG.FUEL_NANITES.healPerFuelChunk[naniteLvl - 1];
                const actualHeal = Math.round(this.tryRepairHull(healAmt));
                if (naniteLvl >= 2) this.addHeat(-4);
                if (this.hasSynergy('ETERNAL_PHOENIX')) {
                    this.addFuel(2);
                }
                if (gameRef) {
                    gameRef.spawnParticles(this.gridX, this.gridY, '#fb7185', 8, 90);
                    if (actualHeal > 0) {
                        gameRef.spawnFloatingText(this.visualX, this.visualY - 0.5, `+${actualHeal} HP (ФЕНИКС)`, '#fb7185', false);
                    }
                }
            }
        }
    }

    getFuelConsumptionMultiplier() {
        let mult = 1.0;
        if (this.hasModifier('ECONOMIZER')) mult *= 0.88;
        const magLvl = this.getModuleLevel('MAGNET_GRAB');
        if (magLvl > 0) {
            mult *= (1 - MODULES_CATALOG.MAGNET_GRAB.fuelSave[magLvl - 1]);
        }
        if (this.isOverheated()) mult *= 1.45;
        return mult;
    }

    getOreMultiplier() {
        const magLvl = this.getModuleLevel('MAGNET_GRAB');
        if (magLvl > 0) {
            return MODULES_CATALOG.MAGNET_GRAB.oreMult[magLvl - 1] * (this.hasModifier('PROSPECTOR') ? 1.15 : 1);
        }
        return this.hasModifier('PROSPECTOR') ? 1.15 : 1.0;
    }

    resetLayerEconomy(layer) {
        this.worldDangerScale = getLayerDangerScale(layer);
        this.overheatDamageTimer = 0;
        this.oreLayer = layer;
        this.oreRawExtracted = 0;
        this.oreRecoveryCarry = 0;
        this.layerOreEarned = 0;
    }

    getOreRecoveryFactor() {
        return 1 / (1 + this.oreRawExtracted / getOreAllowance(this.oreLayer));
    }

    getEffectiveDrillPower() {
        const torqueBonus = 1 + this.chassisLevels.torque * CHASSIS_UPGRADES.torque.speedBonusPerLevel;
        let power = this.baseDrillPower * torqueBonus;
        power *= 1 + this.flowStacks * CONFIG.FLOW_POWER_PER_STACK;
        if (this.boostTimer > 0) power *= CONFIG.BOOST_POWER_MULTIPLIER;
        if (this.hasModifier('HARD_BIT')) power *= 1.25;
        if (this.hasModifier('HOT_BIT') && this.heat >= 40) power *= 1.30;
        if (this.chronoBuffTimer > 0) power *= 1.40;
        if (this.cryoSlowTimer > 0) power *= 0.62;
        if (this.isOverheated() && this.boostTimer <= 0) power *= 0.55;
        return power;
    }

    addFuel(amount) {
        if (!Number.isFinite(amount) || amount <= 0) return 0;
        const gained = Math.min(this.maxFuel - this.fuel, Math.round(amount));
        this.fuel += gained;
        return gained;
    }

    addOre(baseAmount) {
        if (!Number.isFinite(baseAmount) || baseAmount <= 0) return 0;
        const raw = baseAmount * this.getOreMultiplier();
        const allowance = getOreAllowance(this.oreLayer);
        // Интеграл плавной кривой: дробление награды на мелкие события не повышает доход.
        const recovered = allowance * Math.log1p(raw / (allowance + this.oreRawExtracted));
        this.oreRawExtracted += raw;
        const gained = Math.max(0, Math.floor(recovered + this.oreRecoveryCarry + 0.5));
        this.oreRecoveryCarry += recovered - gained;
        this.ore += gained;
        this.layerOreEarned += gained;
        return gained;
    }

    addHeat(amount) {
        this.heat = Math.max(0, Math.min(100, this.heat + amount));
    }

    takeDamage(amount, sourceType = 'gas') {
        if (!Number.isFinite(amount) || amount <= 0) return 0;
        const shieldMod = this.getModuleObj('TITAN_SHIELD');
        if (shieldMod && this.shieldReady) {
            this.shieldReady = false;
            shieldMod.timer = MODULES_CATALOG.TITAN_SHIELD.cooldowns[shieldMod.level - 1];
            return 0; // Урон полностью поглощен щитом!
        }

        const incoming = amount * this.worldDangerScale;
        let dmg = incoming;
        if (sourceType === 'lava' && this.hasModifier('CERAMIC_SHELL')) dmg *= 0.8;
        if (sourceType === 'rock' && this.hasModifier('ROCK_PADDING')) dmg *= 0.8;
        if (shieldMod && shieldMod.level >= 2) {
            dmg *= 0.85;
        }

        // Демпферная Броня «Бастион» снижает урон от взрывов газа, обвалов и тектонических ударов
        const bastionLvl = this.getModuleLevel('BLAST_ARMOR');
        if (bastionLvl > 0 && (sourceType === 'gas' || sourceType === 'rock' || sourceType === 'tectonic')) {
            const red = MODULES_CATALOG.BLAST_ARMOR.dmgReduction[bastionLvl - 1];
            dmg *= (1 - red);
        }

        // Пиро-Реактор «Саламандра» защищает от Лавы и огненных прорывов
        const aegisLvl = this.getModuleLevel('THERMAL_AEGIS');
        if (aegisLvl > 0 && (sourceType === 'lava' || sourceType === 'tectonic')) {
            const lavaRed = MODULES_CATALOG.THERMAL_AEGIS.lavaReduction[aegisLvl - 1];
            dmg *= (1 - lavaRed);
        }

        const finalDmg = Math.max(1, Math.round(Math.max(dmg, incoming * 0.35)));
        if (this.hasModifier('EMERGENCY_COOLER')) this.addHeat(-15);
        this.hull = Math.max(0, this.hull - finalDmg);
        if (this.damageHistory[sourceType] !== undefined) {
            this.damageHistory[sourceType] += finalDmg;
        }
        return finalDmg;
    }
}
