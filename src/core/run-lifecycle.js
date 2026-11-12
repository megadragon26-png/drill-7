/**
 * Начало забега, переходы между слоями, размер canvas.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { BIOMES } from '../data/biomes.js';
import { CONFIG } from '../data/config.js';
import { DrillMachine } from '../entities/drill-machine.js';
import { LayerGenerator } from '../world/layer-generator.js';

export class RunLifecycle {
    getBiomesForTier(tier) {
        const clampedTier = Math.max(1, Math.min(6, tier));
        const matches = BIOMES.filter(b => b.depthTier === clampedTier);
        return matches.length ? matches : [BIOMES[BIOMES.length - 1]];
    }

    resizeCanvas() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    startNewRun() {
        this.hideGameModals();
        this.setApplicationShell('game');
        this.hasActiveRun = true;
        this.cameraY = 0;
        document.getElementById('modal-expedition').classList.add('hidden');
        this.modifierDepth = 0;
        this.modifierBudget = 0;
        this.hitStopTimer = 0;
        this.screenShake = 0;
        this.damageFlashTimer = 0;
        this.keys = { left: false, right: false, down: false };
        // Забег всегда стартует со Слоя 1 (Земная Кора, index = 0)
        this.currentBiomeIndex = 0;
        this.currentLayerNumber = 1;
        this.selectedNextBiomeIndex = 1;
        // Бесплатные стартовые лазеры включают действие до первой находки.
        this.drill = new DrillMachine(
            Math.floor(CONFIG.GRID_COLS / 2),
            1,
            this.meta.state.baseModuleSlots
        );
        this.drill.installModule('SIDE_LASERS', 0);
        this.grid = LayerGenerator.generateLayer(this.currentBiomeIndex, this.currentLayerNumber, this.meta.state.unlockedProjects);
        this.hazardDirector.reset(this.currentBiomeIndex);
        this.particles = [];
        this.floatingTexts = [];
        this.rockets = [];
        this.bombs = [];
        this.projectiles = [];
        this.laserBeams = [];
        this.lightningArcs = [];
        this.shockwaveRings = [];
        this.deathInfo = null;
        this.state = 'PLAYING';
        document.getElementById('modal-pause').classList.add('hidden');
        document.getElementById('damage-alert-banner').classList.add('hidden');
        this.spawnFloatingText(this.drill.visualX, this.drill.visualY, `${BIOMES[this.currentBiomeIndex].name} (${CONFIG.LAYER_ROWS}м)`, '#38bdf8', true);
        this.updateHUD();
    }

    descendToNextLayer() {
        document.getElementById('modal-station').classList.add('hidden');
        // Особая награда за прохождение всех 6 слоев кампании (Прорыв Сингулярного Ядра!)
        if (this.currentLayerNumber === 6) {
            this.meta.depositOre(150);
            this.spawnFloatingText(this.drill.visualX, this.drill.visualY - 0.5, 'ЯДРО ПРОБИТО! БОНУС +150 РУДЫ В БАНК!', '#fde047', true);
        }
        this.currentLayerNumber++;
        this.drill.flowStacks = 0;
        this.drill.flowTimer = 0;
        this.drill.resetLayerEconomy(this.currentLayerNumber);
        if (typeof this.selectedNextBiomeIndex === 'number' && BIOMES[this.selectedNextBiomeIndex]) {
            this.currentBiomeIndex = this.selectedNextBiomeIndex;
        } else {
            const nextOptions = this.getBiomesForTier(this.currentLayerNumber);
            this.currentBiomeIndex = nextOptions[0].index;
        }
        this.drill.gridX = Math.floor(CONFIG.GRID_COLS / 2);
        this.drill.gridY = 1;
        this.drill.visualX = this.drill.gridX;
        this.drill.visualY = this.drill.gridY;
        this.cameraY = 0;
        this.grid = LayerGenerator.generateLayer(this.currentBiomeIndex, this.currentLayerNumber, this.meta.state.unlockedProjects);
        this.hazardDirector.reset(this.currentBiomeIndex);
        this.particles = [];
        this.rockets = [];
        this.bombs = [];
        this.projectiles = [];
        this.laserBeams = [];
        this.lightningArcs = [];
        this.shockwaveRings = [];
        this.state = 'PLAYING';
        const layerTitle = this.currentLayerNumber <= 6
            ? `${BIOMES[this.currentBiomeIndex].name} (${CONFIG.LAYER_ROWS}м)`
            : `Бездна Ур.${this.currentLayerNumber}: ${BIOMES[this.currentBiomeIndex].shortName} (${CONFIG.LAYER_ROWS}м)`;
        this.spawnFloatingText(this.drill.visualX, this.drill.visualY, layerTitle, '#fbbf24', true);
        this.updateHUD();
    }
}
