/**
 * Единственный владелец общего состояния и точка сборки игровых возможностей.
 */
import { SoundSystem } from '../audio/sound-system.js';
import { composeController } from './compose-controller.js';
import { RunLifecycle } from './run-lifecycle.js';
import { InputBindings } from '../input/bind-events.js';
import { MetaProgressionManager } from '../persistence/meta-progression.js';
import { DrillRenderer } from '../rendering/drill-renderer.js';
import { PixelArtGenerator } from '../rendering/pixel-art.js';
import { WorldRenderer } from '../rendering/world-renderer.js';
import { AdvancedWeapons } from '../systems/advanced-weapons.js';
import { DamageSystem } from '../systems/damage.js';
import { EquipmentSystem } from '../systems/equipment.js';
import { MiningSystem } from '../systems/mining.js';
import { Simulation } from '../systems/simulation.js';
import { Weapons } from '../systems/weapons.js';
import { GuideUI } from '../ui/guide.js';
import { HubUI } from '../ui/hub.js';
import { HudUI } from '../ui/hud.js';
import { StationUI } from '../ui/station.js';
import { TechPodUI } from '../ui/tech-pod.js';
import { TectonicHazardDirector } from '../world/hazard-director.js';
import { ExpeditionUI } from '../ui/expedition.js';
import { ModifierEffects } from '../systems/modifier-effects.js';
import { DriveSystem } from '../systems/drive.js';
import { WorldThreats } from '../systems/world-threats.js';
import { MainMenuUI } from '../ui/main-menu.js';

export class GameController {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.art = new PixelArtGenerator();
        this.sound = new SoundSystem();
        this.meta = new MetaProgressionManager();

        // Состояния: 'MENU', 'PLAYING', 'PAUSED', 'GUIDE', 'POD', 'STRUCTURE', 'STATION', 'FATAL_SEQUENCE', 'DEAD', 'HUB'
        this.state = 'MENU';
        this.hasActiveRun = false;
        this.mainMenuTab = 'play';
        this.stationTab = 'mods';
        this.hubTab = 'slots';
        this.prevStateBeforeGuide = 'PLAYING';
        this.activeGuideTab = 'mech';
        this.currentBiomeIndex = 0;
        this.currentLayerNumber = 1;
        this.selectedNextBiomeIndex = 1;

        this.grid = [];
        this.drill = null;

        // Визуальные снаряды и эффекты
        this.particles = [];
        this.floatingTexts = [];
        this.rockets = [];
        this.bombs = [];
        this.projectiles = [];
        this.laserBeams = [];
        this.lightningArcs = [];
        this.shockwaveRings = [];
        this.hazardDirector = new TectonicHazardDirector(this);

        // Экономика станции
        this.stationRerollCount = 0;
        this.stationServiceCount = 0;
        this.stationShopList = [];

        this.cameraY = 0;
        this.screenShake = 0;
        this.hitStopTimer = 0;
        this.damageFlashTimer = 0;
        this.bannerTimeout = null;

        this.fatalSequenceTimer = 0;
        this.deathInfo = null;

        this.keys = { left: false, right: false, down: false };
        this.modifierDepth = 0;
        this.modifierBudget = 0;
        this.currentModifierOffers = [];
        this.currentPodOffers = [];
        this.mobileToolsOpen = false;
        this.hudElapsed = 0;

        this.bindEvents();
        this.resizeCanvas();
        this.openMainMenu();
    }
}

// Подключение всех возможностей до создания первого экземпляра игры.
composeController(GameController, [
    RunLifecycle,
    MainMenuUI,
    ExpeditionUI,
    ModifierEffects,
    DriveSystem,
    WorldThreats,
    InputBindings,
    GuideUI,
    DamageSystem,
    MiningSystem,
    EquipmentSystem,
    AdvancedWeapons,
    Weapons,
    Simulation,
    HudUI,
    TechPodUI,
    StationUI,
    HubUI,
    DrillRenderer,
    WorldRenderer,
]);
