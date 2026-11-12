/** События разрушения: ограниченная глубина цепочки и общий бюджет импульсов. */
import { CONFIG } from '../data/config.js';

export class ModifierEffects {
    applyModifierDamage(x, y, damage) {
        if (this.state !== 'PLAYING' || this.modifierBudget <= 0) return;
        const tile = this.grid[y]?.[x];
        if (!tile || tile.isEmpty() || tile.proto.indestructible || tile.proto.isStation || tile.proto.isTechPod || tile.proto.isStructureConsole) return;
        this.modifierBudget--;
        const amount = damage * (tile.frozen && this.drill.hasModifier('BRITTLE') ? 3 : 1);
        tile.hp -= amount;
        this.spawnParticles(x, y, tile.frozen ? '#7dd3fc' : '#facc15', 3, 65);
        if (tile.hp <= 0) this.destroyBlock(x, y, true);
    }

    onModifierBlockDestroyed(x, y, proto, byWeapon, frozen = false, source = byWeapon ? 'weapon' : 'drill') {
        const drill = this.drill;
        if (proto.oreValue) {
            if (drill.hasModifier('ORE_COOLANT')) drill.addHeat(-4);
            if (drill.hasModifier('ORE_NANITES')) drill.tryRepairHull(1);
            if (frozen && drill.hasModifier('COLD_SALVAGE')) drill.addOre(6);
            if (drill.hasModifier('ORE_CAPACITOR')) drill.oreCapacitorCharge = Math.min(4, drill.oreCapacitorCharge + 1);
        }
        if (proto.fuelGain && drill.hasModifier('FUEL_CATALYST')) drill.addFuel(5);
        if (proto.fuelGain && drill.hasModifier('FUEL_ARMOR')) drill.tryRepairHull(2);
        if (proto.isHard && drill.hasModifier('ROCK_BATTERY')) drill.addFuel(1);
        if (proto.hazard && byWeapon && source !== 'environment' && drill.hasModifier('PRESSURE_RECLAIMER')) drill.addOre(8);
        if (proto.isSupplyCrate && drill.hasModifier('SUPPLY_ARCHIVIST')) drill.addOre(15);
        if (source === 'drill' && !proto.oreValue && !proto.fuelGain && !proto.hazard && !proto.fallingHazard && drill.hasModifier('EXCAVATOR')) {
            drill.excavatorCharge++;
            if (drill.excavatorCharge >= 3) { drill.excavatorCharge = 0; drill.addOre(3); }
        }
        const capacitorReady = drill.hasModifier('ORE_CAPACITOR') && drill.oreCapacitorCharge >= 4;
        const generations = drill.hasModifier('CHAIN_REACTOR') ? 3 : 2;
        if (source === 'environment' || (!byWeapon && !drill.hasModifier('MINING_SPARK') && !capacitorReady) || this.modifierDepth >= generations || this.state !== 'PLAYING') return;
        const root = this.modifierDepth === 0;
        if (root) this.modifierBudget = drill.hasModifier('CHAIN_REACTOR') ? 32 : 24;
        if (capacitorReady) drill.oreCapacitorCharge = 0;
        this.modifierDepth++;
        try {
            const neighbors = [[x - 1, y], [x + 1, y], [x, y + 1], [x, y - 1]]
                .filter(([nx, ny]) => nx > 0 && nx < CONFIG.GRID_COLS - 1 && ny > 2 && ny < CONFIG.LAYER_ROWS - 3);
            if (drill.hasModifier('CRYO')) {
                for (const [nx, ny] of neighbors) {
                    const tile = this.grid[ny][nx];
                    if (!tile.isEmpty() && !tile.proto.indestructible) tile.frozen = true;
                }
            }
            if (drill.hasModifier('INDUCTION')) {
                const candidates = [...neighbors];
                if (drill.hasModifier('LONG_ARC')) candidates.push([x - 2, y], [x + 2, y], [x, y + 2], [x, y - 2]);
                const targets = candidates.filter(([nx, ny]) => {
                    const tile = this.grid[ny]?.[nx];
                    return tile && ny > 2 && ny < CONFIG.LAYER_ROWS - 3 && !tile.isEmpty() && !tile.proto.indestructible && !tile.proto.isStation && !tile.proto.isTechPod && !tile.proto.isStructureConsole;
                }).slice(0, drill.hasModifier('ARC_SPLITTER') ? 2 : 1);
                for (const target of targets) {
                    this.lightningArcs.push({ x1: (x + 0.5) * CONFIG.TILE_SIZE, y1: (y + 0.5) * CONFIG.TILE_SIZE,
                        x2: (target[0] + 0.5) * CONFIG.TILE_SIZE, y2: (target[1] + 0.5) * CONFIG.TILE_SIZE, life: 0.22 });
                    this.applyModifierDamage(...target, 24);
                }
            }
            if (drill.hasModifier('SHRAPNEL')) {
                const targets = [...neighbors];
                if (drill.hasModifier('DEEP_SHARDS')) targets.push([x, y + 2], [x, y + 3]);
                for (const [nx, ny] of targets) this.applyModifierDamage(nx, ny, drill.hasModifier('SHRAPNEL_LENS') ? 20 : 12);
            }
            if (capacitorReady) for (const [nx, ny] of neighbors) this.applyModifierDamage(nx, ny, 24);
        } finally {
            this.modifierDepth--;
            if (root) this.modifierBudget = 0;
        }
    }
}
