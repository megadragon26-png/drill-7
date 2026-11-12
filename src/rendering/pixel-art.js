/**
 * Процедурные спрайты, иконки и их вставка в DOM. Файлов изображений нет.
 */
import { TileTextureGenerator } from './tile-textures.js';

export class PixelArtGenerator extends TileTextureGenerator {
    constructor() {
        super();
        this.textures = {};
        this.icons = {};
        this.moduleIcons = {};
        this.upgradeIcons = {};
        this.initAllAssets();
    }

    initAllAssets() {
        // Сочные, контрастные текстуры пород и самоцветов (никакой серой грязи!)
        this.textures.DIRT = this.generateTileTexture('#9a5833', '#6b381d', '#bd7448', null, 'moss_rock');
        this.textures.CLAY = this.generateTileTexture('#b56535', '#7d401d', '#d9824c');
        this.textures.LIMESTONE = this.generateTileTexture('#4b6b8a', '#314861', '#688eb3');
        this.textures.CRYSTAL_SHALE = this.generateTileTexture('#274c78', '#173152', '#3b6ca6');
        this.textures.MAGMA_BASALT = this.generateTileTexture('#631d30', '#3d0e1b', '#872c44', null, 'magma_rock');
        this.textures.BEDROCK = this.generateTileTexture('#334155', '#1e293b', '#64748b', null, 'bedrock_wall');

        // Новые породы для 6-слойной кампании
        this.textures.SPORE_ROCK = this.generateTileTexture('#365314', '#1a2e05', '#4d7c0f', null, 'moss_rock');
        this.textures.ABYSS_STONE = this.generateTileTexture('#1e3a8a', '#172554', '#2563eb');
        this.textures.NEUTRONIUM = this.generateTileTexture('#3b0764', '#1e0338', '#581c87', null, 'magma_rock');
        this.textures.PERMAFROST_ICE = this.generateTileTexture('#0284c7', '#0369a1', '#38bdf8', '#e0f2fe', 'crystal');
        this.textures.MAGNETITE_ROCK = this.generateTileTexture('#312e81', '#1e1b4b', '#4f46e5', '#facc15', 'ore');
        this.textures.RUSTED_HULL = this.generateTileTexture('#7c2d12', '#431407', '#9a3412', null, 'steel');

        this.textures.OIL_VEIN = this.generateTileTexture('#61442b', '#3d2817', '#805b3b', '#fde047', 'ore');
        this.textures.ENERGY_BLOCK = this.generateTileTexture('#1e3a5f', '#0f233d', '#2d5485', '#10b981', 'energy');

        this.textures.ORE_COAL = this.generateTileTexture('#784c33', '#4d2e1d', '#966244', '#fb923c', 'ore');
        this.textures.ORE_IRON = this.generateTileTexture('#4b647d', '#2f4254', '#6684a1', '#fb923c', 'ore');
        this.textures.ORE_COBALT = this.generateTileTexture('#134e4a', '#042f2e', '#0f766e', '#34d399', 'ore');
        this.textures.ORE_QUARTZ = this.generateTileTexture('#274e78', '#163252', '#3a6ea6', '#22d3ee', 'crystal');
        this.textures.ORE_AMETHYST = this.generateTileTexture('#442c75', '#29184d', '#5f419e', '#e879f9', 'crystal');
        this.textures.ORE_TITANITE = this.generateTileTexture('#662249', '#40112b', '#8a3264', '#f472b6', 'ore');
        this.textures.ORE_CORE = this.generateTileTexture('#6e1b2e', '#450d1a', '#942942', '#fda4af', 'crystal');
        this.textures.ORE_AETHERIUM = this.generateTileTexture('#4c1d95', '#2e1065', '#6d28d9', '#fde047', 'crystal');
        this.textures.OBSIDIAN = this.generateTileTexture('#312e81', '#1e1b4b', '#4f46e5', '#a5b4fc', 'crystal');
        this.textures.ORE_VITALIUM = this.generateTileTexture('#4a2040', '#2b1024', '#6e325f', '#fb7185', 'vitalium');

        this.textures.GAS_POCKET = this.generateTileTexture('#4d6b26', '#314714', '#698f37', null, 'gas');
        this.textures.UNSTABLE_ROCK = this.generateTileTexture('#64748b', '#475569', '#94a3b8', null, 'boulder');
        this.textures.THERMAL_POCKET = this.generateTileTexture('#7f1d1d', '#450a0a', '#b91c1c', null, 'lava');
        this.textures.ACID_POCKET = this.generateTileTexture('#14532d', '#052e16', '#22c55e', null, 'gas');
        this.textures.VOID_POCKET = this.generateTileTexture('#3b0764', '#1e0238', '#9333ea', null, 'lava');
        this.textures.CRYO_TRAP = this.generateTileTexture('#0369a1', '#0c4a6e', '#38bdf8', '#ffffff', 'crystal');
        this.textures.ELECTRO_NODE = this.generateTileTexture('#1e1b4b', '#0f172a', '#eab308', '#fef08a', 'energy');
        this.textures.ARC_MINE = this.generateTileTexture('#7c2d12', '#431407', '#ea580c', '#fde047', 'boulder');
        this.textures.STATION_GATE = this.generateTileTexture('#0891b2', '#164e63', '#22d3ee', null, 'station');
        this.textures.TECH_POD = this.generateTileTexture('#0284c7', '#0369a1', '#38bdf8', null, 'pod');
        this.textures.STEEL_BEAM = this.generateTileTexture('#475569', '#1e293b', '#94a3b8', null, 'steel');
        this.textures.ANCIENT_BRICK = this.generateTileTexture('#3730a3', '#1e1b4b', '#6366f1', null, 'ruins');
        this.textures.SUPPLY_CRATE = this.generateTileTexture('#d97706', '#78350f', '#fbbf24', null, 'crate');
        this.textures.CHRONO_SPHERE = this.generateTileTexture('#0369a1', '#0c4a6e', '#38bdf8', null, 'chrono');
        this.textures.OMEGA_MEDKIT = this.generateTileTexture('#059669', '#064e3b', '#34d399', null, 'medkit');
        this.textures.STAR_RELIC = this.generateTileTexture('#ca8a04', '#713f12', '#fde047', null, 'relic');

        this.icons.fuel = this.createMatrixCanvas([
            "...YYYYYY...",
            "..YOOOOOOY..",
            ".YOOYYYYOOY.",
            ".YOY....YOY.",
            ".YOOOOOOYOY.",
            ".YOOOOOOOOY.",
            ".YOOYYYYOOY.",
            ".YOOOOOOOOY.",
            "..YYYYYYYY.."
        ], { Y: '#fbbf24', O: '#d97706' }, 2);

        this.icons.hull = this.createMatrixCanvas([
            "..RRRRRRRR..",
            ".RMMMMMMMMR.",
            "RMMWWWWWWMMR",
            "RMW..RR..WMR",
            "RMW..RR..WMR",
            ".RMW....WMR.",
            "..RMW..WMR..",
            "...RMWWMR...",
            "....RMMR...."
        ], { R: '#f43f5e', M: '#be123c', W: '#ffe4e6' }, 2);

        this.icons.heat = this.createMatrixCanvas([
            "....WWWW....",
            "...W.RR.W...",
            "...W.OO.W...",
            "...W.RR.W...",
            "..W.RRRR.W..",
            ".W.RRRRRR.W.",
            ".W.RRYYRR.W.",
            "..WWWWWWWW.."
        ], { W: '#94a3b8', R: '#ef4444', O: '#f97316', Y: '#fef08a' }, 2);

        this.icons.ore = this.createMatrixCanvas([
            "....OOOO....",
            "..OOYYYYOO..",
            ".OYYWWWWYYO.",
            "OYWWCCCCYYOO",
            "OYWCCCCCCYYO",
            ".OYYOOOOYYO.",
            "..OOYYYYOO..",
            "....OOOO...."
        ], { O: '#9a3412', Y: '#fbbf24', W: '#fef08a', C: '#38bdf8' }, 2);

        this.icons.audio = this.createMatrixCanvas([
            ".....WW...C.",
            "....WWW..C.C",
            "..WWWWWW...C",
            ".WWWWWWW.C.C",
            "..WWWWWW..C.",
            "....WWW.C..."
        ], { W: '#94a3b8', C: '#fbbf24' }, 2);

        this.icons.pause = this.createMatrixCanvas([
            "............",
            "..CCC..CCC..",
            "..CWC..CWC..",
            "..CWC..CWC..",
            "..CWC..CWC..",
            "..CWC..CWC..",
            "..CWC..CWC..",
            "..CCC..CCC..",
            "............"
        ], { C: '#0284c7', W: '#bae6fd' }, 2);

        this.icons.guide = this.createMatrixCanvas([
            ".EEEEEEEEEE.",
            "EGGGGGGGGGGE",
            "EGWWWWWWWWGE",
            "EGWEEEEEEWGE",
            "EGWWWWWWWWGE",
            "EGWEEEEEEWGE",
            "EGWWWWWWWWGE",
            "EGGGGGGGGGGE",
            ".EEEEEEEEEE."
        ], { E: '#10b981', G: '#065f46', W: '#d1fae5' }, 2);

        // Пиксельные иконки для каждого из 9 модулей
        this.moduleIcons.ROCKET_POD = this.createMatrixCanvas([
            "....RR....",
            "...RYYR...",
            "..RYYYYR..",
            "..RWWWWWR.",
            "..RWWWWWR.",
            ".RWWOOOWWR",
            "RWW.OO.WWR",
            "R...OO...R",
            "...Y..Y..."
        ], { R: '#ef4444', Y: '#fde047', W: '#e2e8f0', O: '#f97316' }, 2);

        this.moduleIcons.TESLA_COIL = this.createMatrixCanvas([
            "....CCCC..",
            "...CCWWC..",
            "..CCWW....",
            ".CCWWCCCCC",
            "..CCCCWWCC",
            "....WWCC..",
            "...WWCC...",
            "..WWCC....",
            ".WWC......"
        ], { C: '#0284c7', W: '#7dd3fc' }, 2);

        this.moduleIcons.SIDE_LASERS = this.createMatrixCanvas([
            "..........",
            ".MM....MM.",
            "RRRR..RRRR",
            "WWWWWWWWWW",
            "RRRR..RRRR",
            ".MM....MM.",
            "..........",
            "..YYYYYY..",
            ".........."
        ], { M: '#9f1239', R: '#f43f5e', W: '#ffe4e6', Y: '#fbbf24' }, 2);

        this.moduleIcons.SEISMO_MORTAR = this.createMatrixCanvas([
            "....YY....",
            "...OOOO...",
            "..GGGGGG..",
            ".GGYYYYGG.",
            ".GGYWWYGG.",
            ".GGYYYYGG.",
            "..GGGGGG..",
            "...GGGG...",
            ".........."
        ], { Y: '#fde047', O: '#f97316', G: '#334155', W: '#ffffff' }, 2);

        this.moduleIcons.MINING_DRONE = this.createMatrixCanvas([
            "GG......GG",
            ".GGGGGGGG.",
            "..GEEEEG..",
            ".GEEWWEEG.",
            ".GEEWWEEG.",
            "..GEEEEG..",
            ".GG.YY.GG.",
            "G...YY...G",
            ".........."
        ], { G: '#065f46', E: '#10b981', W: '#d1fae5', Y: '#fbbf24' }, 2);

        this.moduleIcons.FROST_NOVA = this.createMatrixCanvas([
            "....CC....",
            ".C..WW..C.",
            "..C.WW.C..",
            "...CWWC...",
            "CWWWWWWWWC",
            "...CWWC...",
            "..C.WW.C..",
            ".C..WW..C.",
            "....CC...."
        ], { C: '#0284c7', W: '#bae6fd' }, 2);

        this.moduleIcons.GAS_FILTER = this.createMatrixCanvas([
            "..GGGGGG..",
            ".GLLLLLLG.",
            "GLLWWWWLLG",
            "GLW.GG.WLG",
            "GLLGGGGLLG",
            ".GLLLLLLG.",
            "..GGYYGG..",
            "..GYYYYG..",
            "...GGGG..."
        ], { G: '#365314', L: '#84cc16', W: '#ecfccb', Y: '#fbbf24' }, 2);

        this.moduleIcons.MAGNET_GRAB = this.createMatrixCanvas([
            ".RRR..RRR.",
            ".WWW..WWW.",
            ".BBB..BBB.",
            ".BBB..BBB.",
            ".BBBBBBBB.",
            "..BBBBBB..",
            "...YYYY...",
            "....YY....",
            ".........."
        ], { R: '#ef4444', W: '#f8fafc', B: '#3b82f6', Y: '#fde047' }, 2);

        this.moduleIcons.TITAN_SHIELD = this.createMatrixCanvas([
            ".IIIIIIII.",
            "IBBBBBBBBI",
            "IBWWWWWWBI",
            "IBWIIIIWBI",
            "IBWIIIIWBI",
            ".IBWWWWBI.",
            "..IBBBBI..",
            "...IBBI...",
            "....II...."
        ], { I: '#4f46e5', B: '#818cf8', W: '#e0e7ff' }, 2);

        this.moduleIcons.PLASMA_ANNIHILATOR = this.createMatrixCanvas([
            "..YYYYYY..",
            ".YOOOOOOY.",
            "YOWWWWWWOY",
            ".YOWWWWOY.",
            "...YWWY...",
            "...YWWY...",
            "..OYWWYO..",
            ".OOYWWYOO.",
            "YYYYWWYYYY"
        ], { Y: '#fde047', O: '#f97316', W: '#ffffff' }, 2);

        this.moduleIcons.GRAV_SINGULARITY = this.createMatrixCanvas([
            "..PPPPPP..",
            ".PMMMMMMP.",
            "PMWDDDDWMP",
            "PMDWWWWDDP",
            "PMDWDDWDDP",
            "PMDWWWDDMP",
            "PMWDDDDWMP",
            ".PMMMMMMP.",
            "..PPPPPP.."
        ], { P: '#a855f7', M: '#ec4899', W: '#fdf4ff', D: '#1e1b4b' }, 2);

        this.moduleIcons.BLAST_ARMOR = this.createMatrixCanvas([
            ".EEEEEEEE.",
            "EGGGGGGGGE",
            "EGWWWWWWGE",
            "EGWEEEEWGE",
            "EGWEEEEWGE",
            ".EGWWWWGE.",
            "..EGGGGE..",
            "...EGGE...",
            "....EE...."
        ], { E: '#10b981', G: '#047857', W: '#d1fae5' }, 2);

        this.moduleIcons.FUEL_NANITES = this.createMatrixCanvas([
            "...RRRR...",
            "..RWWWWR..",
            ".RWWRRWW.R",
            "RWW.RR.WWR",
            "RWRRRRRRWR",
            "RWW.RR.WWR",
            ".RWWRRWWR.",
            "..RYYYYR..",
            "...YYYY..."
        ], { R: '#f43f5e', W: '#ffe4e6', Y: '#fbbf24' }, 2);

        this.moduleIcons.ORE_GATLING = this.createMatrixCanvas([
            "..YY..YY..",
            "..YY..YY..",
            ".GGGGGGGG.",
            ".GWWWWWWG.",
            ".GGGGGGGG.",
            "..OO..OO..",
            "..OO..OO..",
            "..YY..YY..",
            ".........."
        ], { Y: '#fde047', G: '#475569', W: '#e2e8f0', O: '#f97316' }, 2);

        this.moduleIcons.SAW_BLADES = this.createMatrixCanvas([
            "..W..W..W.",
            ".CCCCCCCC.",
            "WCCWWWWCCW",
            ".CWWDDWWC.",
            "WCWDDDDWCW",
            ".CWWDDWWC.",
            "WCCWWWWCCW",
            ".CCCCCCCC.",
            ".W..W..W.."
        ], { W: '#f8fafc', C: '#2dd4bf', D: '#0f172a' }, 2);

        this.moduleIcons.THERMAL_AEGIS = this.createMatrixCanvas([
            "....YY....",
            "...YOOY...",
            "..YOOROY..",
            ".YORWWROY.",
            "YORWWWWROY",
            "YORWYYWROY",
            ".YORRRROY.",
            "..YOOOOY..",
            "...YYYY..."
        ], { Y: '#fde047', O: '#f97316', R: '#dc2626', W: '#ffffff' }, 2);

        this.moduleIcons.OMEGA_CONVERTER = this.createMatrixCanvas([
            "...YYYY...",
            ".YYOOOOYY.",
            "YOWWWWWWOY",
            "YOWYYYYWOY",
            "YOWYCCYWOY",
            "YOWYYYYWOY",
            "YOWWWWWWOY",
            ".YYOOOOYY.",
            "...YYYY..."
        ], { Y: '#fde047', O: '#d97706', W: '#fef9c3', C: '#38bdf8' }, 2);

        // Иконки апгрейдов шасси и слотов
        this.upgradeIcons.torque = this.createMatrixCanvas([
            "....WW....",
            "...WWWW...",
            "..CCCCCC..",
            "..CWWWWC..",
            ".CCWWWWCC.",
            ".CCCCCCCC.",
            "..YYYYYY..",
            ".YYYYYYYY.",
            ".........."
        ], { W: '#f8fafc', C: '#38bdf8', Y: '#f59e0b' }, 2);

        this.upgradeIcons.tank = this.createMatrixCanvas([
            "..YYYYYY..",
            ".YOOOOOOY.",
            ".YOWWWWOY.",
            ".YOWGGWOY.",
            ".YOGGGGOY.",
            ".YOWGGWOY.",
            ".YOOOOOOY.",
            "..YYYYYY..",
            ".........."
        ], { Y: '#fbbf24', O: '#d97706', W: '#fef3c7', G: '#10b981' }, 2);

        this.upgradeIcons.armor = this.createMatrixCanvas([
            ".SSSSSSSS.",
            "SRRRRRRRRS",
            "SRWWWWWWRS",
            "SRWRRRRWRS",
            "SRWRRRRWRS",
            "SRWWWWWWRS",
            "SRRRRRRRRS",
            ".SSSSSSSS.",
            ".........."
        ], { S: '#94a3b8', R: '#e11d48', W: '#fecdd3' }, 2);

        this.upgradeIcons.slot = this.createMatrixCanvas([
            ".CCCCCCCC.",
            "C........C",
            "C..YYYY..C",
            "C.YYYYYY.C",
            "C.YYWWYY.C",
            "C.YYYYYY.C",
            "C..YYYY..C",
            "C........C",
            ".CCCCCCCC."
        ], { C: '#22d3ee', Y: '#f59e0b', W: '#ffffff' }, 2);

        this.drawToCanvas('hud-icon-fuel', this.icons.fuel);
        this.drawToCanvas('hud-icon-hull', this.icons.hull);
        this.drawToCanvas('hud-icon-heat', this.icons.heat);
        this.drawToCanvas('hud-icon-ore', this.icons.ore);
        this.drawToCanvas('hud-icon-audio', this.icons.audio);
        this.drawToCanvas('hud-icon-pause', this.icons.pause);
        this.drawToCanvas('hud-icon-guide', this.icons.guide);
        this.drawToCanvas('pause-modal-icon', this.icons.pause);
        this.drawToCanvas('guide-modal-icon', this.icons.guide);
        this.drawToCanvas('pod-modal-icon', this.textures.TECH_POD);
        this.drawToCanvas('station-header-icon', this.textures.STATION_GATE);
        this.drawToCanvas('hub-header-icon', this.upgradeIcons.torque);
        this.drawToCanvas('hub-bank-icon', this.icons.ore);
        this.drawToCanvas('hub-icon-slot', this.upgradeIcons.slot);
        this.drawToCanvas('st-icon-fuel', this.icons.fuel);
        this.drawToCanvas('st-icon-hull', this.icons.hull);
        this.drawToCanvas('icon-upg-torque', this.upgradeIcons.torque);
        this.drawToCanvas('icon-upg-tank', this.upgradeIcons.tank);
        this.drawToCanvas('icon-upg-armor', this.upgradeIcons.armor);
    }

    drawToCanvas(canvasId, sourceCanvas) {
        const target = document.getElementById(canvasId);
        if (!target || !sourceCanvas) return;
        const ctx = target.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, target.width, target.height);
        ctx.drawImage(sourceCanvas, 0, 0, target.width, target.height);
    }

    createIconCanvasElement(sourceCanvas, sizePx = 24, extraClasses = '') {
        const c = document.createElement('canvas');
        c.width = sizePx;
        c.height = sizePx;
        c.className = `shrink-0 rounded bg-[#070a12] p-0.5 border border-slate-700/80 ${extraClasses}`;
        if (sourceCanvas) {
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sourceCanvas, 0, 0, sizePx, sizePx);
        }
        return c;
    }
}
