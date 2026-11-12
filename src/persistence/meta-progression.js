/**
 * Загрузка и сохранение метапрогрессии в localStorage.
 */
import { CONFIG } from '../data/config.js';

export class MetaProgressionManager {
    constructor() {
        this.storageKey = 'bur7_hardcore_roguelite_v5';
        this.state = {
            bankOre: 60,
            baseModuleSlots: CONFIG.START_MODULE_SLOTS,
            unlockedModules: ['SIDE_LASERS', 'GAS_FILTER', 'MAGNET_GRAB', 'BLAST_ARMOR', 'FUEL_NANITES', 'TESLA_COIL', 'ROCKET_POD'],
            unlockedProjects: [],
            unlockedBiomes: [0],
            selectedBiome: 0
        };
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed.bankOre === 'number') {
                    this.state = Object.assign(this.state, parsed);
                    if (!Array.isArray(this.state.unlockedProjects)) {
                        this.state.unlockedProjects = [];
                    }
                }
            }
        } catch (e) {
            console.warn('Ошибка чтения сохранения:', e);
        }
    }

    hasProject(projId) {
        return Array.isArray(this.state.unlockedProjects) && this.state.unlockedProjects.includes(projId);
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.warn('Ошибка записи сохранения:', e);
        }
    }

    depositOre(amount) {
        this.state.bankOre += Math.max(0, Math.round(amount));
        this.save();
    }

    spendOre(cost) {
        if (this.state.bankOre < cost) return false;
        this.state.bankOre -= cost;
        this.save();
        return true;
    }
}
