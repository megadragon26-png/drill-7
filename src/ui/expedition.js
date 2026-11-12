/** Автоматические тайники, пул модификаторов и открываемый вручную инвентарь. */
import { STRUCTURES_CATALOG } from '../data/structures.js';
import { MODIFIERS_CATALOG } from '../data/modifiers.js';

export class ExpeditionUI {
    openModifierInventory() {
        if (this.state !== 'PLAYING') return;
        let description = this.drill.modifiers.length
            ? this.drill.modifiers.map(id => `${MODIFIERS_CATALOG[id].name}: ${MODIFIERS_CATALOG[id].desc}`).join('\n\n')
            : 'Модификаторов пока нет. Ищите тайники комплексов и техно-капсулы. Находки сочетаются друг с другом и не занимают слоты устройств.';
        const synergies = this.drill.getActiveSynergies();
        description = `ДОБЫЧА СЛОЯ: ${this.drill.layerOreEarned} руды. Выход: ${Math.round(this.drill.getOreRecoveryFactor() * 100)}%.\nПо мере разработки слоя выход плавно снижается; следующий слой восстанавливает его. Рудные награды указаны до этого снижения.\n\n` + description;
        if (synergies.length) description += '\n\nАКТИВНЫЕ СОЧЕТАНИЯ\n' + synergies.map(item => `${item.name}: ${item.desc}`).join('\n\n');
        if (this.grid.surveyed) {
            description += '\n\nКАРТА СЛОЯ\n' + this.grid.structures.map(room => {
                const spec = STRUCTURES_CATALOG[room.family];
                const status = room.looted ? 'тайник собран' : (room.cacheY < this.drill.gridY ? 'выше бура' : 'впереди');
                return `${room.y} м · ${spec.name} · ${spec.variants[room.variant]} (${status})\n${spec.desc}`;
            }).join('\n\n');
        }
        this.showExpeditionInventory('Находки экспедиции', description);
    }

    getAvailableModifierIds() {
        return Object.keys(MODIFIERS_CATALOG).filter(id => {
            const spec = MODIFIERS_CATALOG[id];
            return !this.drill.hasModifier(id)
                && (!spec.requires || spec.requires.every(key => this.drill.hasModifier(key)))
                && (!spec.requiresAny || spec.requiresAny.some(key => this.drill.hasModifier(key)))
                && (!spec.device || this.drill.hasModule(spec.device));
        });
    }

    getModifierOffers(count = 2) {
        const pool = this.getAvailableModifierIds();
        const result = [];
        while (pool.length && result.length < count) result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        return result;
    }

    showExpeditionInventory(title, description) {
        this.state = 'STRUCTURE';
        this.keys = { left: false, right: false, down: false };
        const modal = document.getElementById('modal-expedition');
        document.getElementById('expedition-title').textContent = title;
        document.getElementById('expedition-description').textContent = description;
        const list = document.getElementById('expedition-choices');
        const button = document.createElement('button');
        button.className = 'expedition-choice';
        button.textContent = 'Продолжить спуск';
        button.addEventListener('click', () => {
            if (this.state !== 'STRUCTURE') return;
            modal.classList.add('hidden');
            this.state = 'PLAYING';
            this.updateHUD();
        });
        list.replaceChildren(button);
        modal.classList.remove('hidden');
        modal.onkeydown = event => {
            if (event.key === 'Tab') { event.preventDefault(); button.focus(); }
        };
        button.focus();
    }

    collectStructureCache(id) {
        const room = this.grid.structures?.find(item => item.id === id);
        if (!room || room.looted) return false;
        room.looted = true;
        const spec = STRUCTURES_CATALOG[room.family];
        let message;
        if (spec.cacheReward === 'modifier') {
            const modifier = this.getModifierOffers(1)[0];
            if (modifier && this.drill.installModifier(modifier)) message = MODIFIERS_CATALOG[modifier].name;
            else message = `ЛОМ: +${this.drill.addOre(20)} РУДЫ`;
        } else if (spec.cacheReward === 'survey') {
            this.grid.surveyed = true;
            message = 'КАРТА СЛОЯ ЗАГРУЖЕНА';
        } else if (spec.cacheReward === 'fuel') {
            message = `РЕЗЕРВ: +${Math.round(this.drill.addFuel(12))} ТОПЛИВА`;
        } else message = `ЛОМ: +${this.drill.addOre(25)} РУДЫ`;
        this.spawnFloatingText(room.x, room.cacheY - 0.5, message, spec.color, true);
        this.sound.playStationDock();
        return true;
    }
}
