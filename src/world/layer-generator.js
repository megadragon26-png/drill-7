/** Геология, резервирование комплексов и проверяемые нисходящие маршруты. */
import { BIOMES } from '../data/biomes.js';
import { CONFIG } from '../data/config.js';
import { TILE_TYPES } from '../data/tiles.js';
import { STRUCTURES_CATALOG } from '../data/structures.js';
import { BlockTile } from '../entities/block-tile.js';
import { getLayerHardnessScale } from '../data/economy.js';

export class LayerGenerator {
    static generateLayer(biomeIndex, layerNumber, unlockedProjects = []) {
        const biome = BIOMES[Math.min(biomeIndex, BIOMES.length - 1)];
        const cols = CONFIG.GRID_COLS;
        const rows = biome.rows || 95;
        CONFIG.LAYER_ROWS = rows;
        const scale = getLayerHardnessScale(layerNumber);
        const grid = [];
        grid.landmarks = [];
        grid.structures = [];
        grid.threats = [];
        grid.surveyed = false;
        const pick = (items) => items[Math.floor(Math.random() * items.length)];
        const weights = biome.weights.map(item => ({ ...item, weight: item.weight * (TILE_TYPES[item.type].hullGain ? 0.45 : 1) }));
        const weighted = () => {
            let roll = Math.random() * weights.reduce((sum, item) => sum + item.weight, 0);
            for (const item of weights) {
                roll -= item.weight;
                if (roll <= 0) return TILE_TYPES[item.type];
            }
            return TILE_TYPES.DIRT;
        };
        const set = (x, y, proto, bg = null) => {
            if (x < 1 || x >= cols - 1 || y < 3 || y >= rows - 3) return;
            const tile = new BlockTile(x, y, proto, scale * (1 + y / rows * 0.85));
            tile.bgType = bg;
            grid[y][x] = tile;
        };

        // Связные пласты: соседние клетки часто продолжают породу слева или сверху.
        for (let y = 0; y < rows; y++) {
            grid[y] = [];
            for (let x = 0; x < cols; x++) {
                let proto;
                if (x === 0 || x === cols - 1) proto = TILE_TYPES.BEDROCK;
                else if (y <= 1) proto = TILE_TYPES.EMPTY;
                else if (y === rows - 3) proto = x >= 3 && x < cols - 3 ? TILE_TYPES.EMPTY : TILE_TYPES.BEDROCK;
                else if (y >= rows - 2) proto = x >= 3 && x < cols - 3 ? TILE_TYPES.STATION_GATE : TILE_TYPES.BEDROCK;
                else if (y === 2) proto = x === Math.floor(cols / 2) ? TILE_TYPES.DIRT : TILE_TYPES.CLAY;
                else {
                    const adjacent = Math.random() < 0.5 ? grid[y][x - 1] : grid[y - 1][x];
                    const candidate = adjacent?.proto;
                    proto = candidate && !candidate.indestructible && candidate.solid && !candidate.oreValue && !candidate.hullGain && !candidate.fuelGain && !candidate.hazard && !candidate.fallingHazard && Math.random() < 0.48
                        ? candidate : weighted();
                }
                grid[y][x] = new BlockTile(x, y, proto, scale * (1 + y / rows * 0.85));
            }
        }

        // Извилистые жилы следуют геологии биома, а не возникают одиночными точками.
        const ores = biome.weights.filter(item => TILE_TYPES[item.type].oreValue && !TILE_TYPES[item.type].hullGain && !TILE_TYPES[item.type].hazard);
        for (let i = 0; i < Math.floor(rows / 9); i++) {
            let x = 2 + Math.floor(Math.random() * (cols - 4));
            let y = 5 + Math.floor(Math.random() * (rows - 15));
            const proto = TILE_TYPES[pick(ores).type];
            for (let step = 0; step < 3 + i % 4; step++) {
                set(x, y, proto);
                x = Math.max(1, Math.min(cols - 2, x + pick([-1, 0, 1])));
                y++;
            }
        }

        // Небольшие полости: сплошной пол оставляет возможность выбрать направление.
        for (let y = 15; y < rows - 10; y += 18) {
            const cx = 3 + Math.floor(Math.random() * (cols - 6));
            for (let dx = -2; dx <= 2; dx++) {
                set(cx + dx, y, TILE_TYPES.EMPTY, 'cave');
                set(cx + dx, y + 1, TILE_TYPES.DIRT, 'cave');
            }
        }

        // Четыре разных комплекса из общего пула; родные биому семейства встречаются чаще.
        const pool = Object.keys(STRUCTURES_CATALOG);
        const families = [];
        while (families.length < 4 && pool.length) {
            const weights = pool.map(id => STRUCTURES_CATALOG[id].affinities?.includes(biome.id) ? 3 : 1);
            let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
            let selected = pool.length - 1;
            for (let i = 0; i < pool.length; i++) {
                roll -= weights[i];
                if (roll <= 0) { selected = i; break; }
            }
            families.push(pool.splice(selected, 1)[0]);
        }
        // Разведка полезна до основных развилок, обмен устройства — после первых находок.
        const archiveIndex = families.indexOf('archive');
        if (archiveIndex > 1) [families[0], families[archiveIndex]] = [families[archiveIndex], families[0]];
        if (families[0] === 'forge') [families[0], families[2]] = [families[2], families[0]];
        families.forEach((family, index) => {
            const spec = STRUCTURES_CATALOG[family];
            const y = index === 0 ? 8 : Math.floor(rows * (0.23 + index * 0.17)) + Math.floor(Math.random() * 4);
            const x = 4 + Math.floor(Math.random() * (cols - 8));
            const variant = Math.floor(Math.random() * spec.variants.length);
            const room = { id: `structure-${index}`, family, variant, x, y, cacheY: y + 4, looted: false,
                bounds: { left: x - 3, right: x + 3, top: y - 2, bottom: y + 7 } };
            grid.structures.push(room);
            for (let dy = -2; dy <= 7; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    const edge = Math.abs(dx) === 3 || dy === -2 || dy === 7;
                    let proto = edge ? TILE_TYPES.STEEL_BEAM : TILE_TYPES.EMPTY;
                    if (dy === 1 || dy === 4) proto = TILE_TYPES.DIRT;
                    if (dx === 0 && (dy === -2 || dy === 7)) proto = TILE_TYPES.DIRT;
                    if (family === 'cathedral' && dy >= 2 && dy <= 3 && Math.abs(dx) === 2) proto = TILE_TYPES.GAS_POCKET;
                    if (family === 'geode' && Math.abs(dx) === 3) proto = variant ? TILE_TYPES.ORE_QUARTZ : TILE_TYPES.ORE_AMETHYST;
                    if (family === 'reactor' && dy === 4 && Math.abs(dx) === 2) proto = variant ? TILE_TYPES.PERMAFROST_ICE : TILE_TYPES.THERMAL_POCKET;
                    if (family === 'forge' && (Math.abs(dx) === 3 || dy === 7)) proto = TILE_TYPES.ANCIENT_BRICK;
                    if (family === 'forge' && dy === 3 && Math.abs(dx) === 2) proto = variant ? TILE_TYPES.ELECTRO_NODE : TILE_TYPES.THERMAL_POCKET;
                    if (family === 'archive' && dy === 2 && Math.abs(dx) === 2) proto = TILE_TYPES.ANCIENT_BRICK;
                    if (family === 'archive' && dy === 5 && Math.abs(dx) === 2) proto = variant ? TILE_TYPES.ORE_QUARTZ : TILE_TYPES.ORE_AMETHYST;
                    if (family === 'titan' && Math.abs(dx) === 3) proto = TILE_TYPES.RUSTED_HULL;
                    if (family === 'titan' && dy === 3 && Math.abs(dx) === 2) proto = variant ? TILE_TYPES.STEEL_BEAM : TILE_TYPES.ARC_MINE;
                    if (family === 'garden' && (Math.abs(dx) === 3 || dy === 7)) proto = TILE_TYPES.PERMAFROST_ICE;
                    if (family === 'garden' && dy === 3 && Math.abs(dx) === 2) proto = variant ? TILE_TYPES.CRYO_TRAP : TILE_TYPES.ORE_VITALIUM;
                    // Собственные внутренние маршруты: горн, стеллажи, двигатель и ледяная арка.
                    if (family === 'forge' && dy === 2 && Math.abs(dx) === 1) proto = TILE_TYPES.STEEL_BEAM;
                    if (family === 'archive' && dx === (variant ? -1 : 1) && dy >= 2 && dy <= 6 && dy !== 4) proto = TILE_TYPES.ANCIENT_BRICK;
                    if (family === 'titan' && dy === 5 && Math.abs(dx) === 1) proto = TILE_TYPES.STEEL_BEAM;
                    if (family === 'garden' && Math.abs(dx) === 2 && (dy === -1 || dy === 6)) proto = TILE_TYPES.PERMAFROST_ICE;
                    set(x + dx, y + dy, proto, spec.bg);
                }
            }
            // Развилка: лёгкий обход снаружи комплекса; внутри — терминал и нижняя камера.
            for (let dy = -2; dy <= 7; dy++) {
                const bypassX = x <= Math.floor(cols / 2) ? x + 4 : x - 4;
                set(bypassX, y + dy, TILE_TYPES.DIRT);
            }
            set(x, room.cacheY, TILE_TYPES.STRUCTURE_CONSOLE, spec.bg);
            grid[room.cacheY][x].structureId = room.id;
            if (family === 'cathedral') set(x, y + 6, TILE_TYPES.STAR_RELIC, spec.bg);
            if (family === 'titan') set(x, y + 6, TILE_TYPES.ORE_TITANITE, spec.bg);
            if (family === 'garden') set(x, y + 6, TILE_TYPES.ORE_VITALIUM, spec.bg);
            if (family === 'bunker' && variant === 0) set(x + 1, y + 6, TILE_TYPES.SUPPLY_CRATE, spec.bg);
            const vertical = spec.danger === 'laser';
            grid.threats.push({ kind: spec.danger, roomId: room.id, x: vertical ? x : x - 2,
                y: vertical ? y + 1 : y + 3, width: vertical ? 1 : 5, height: vertical ? 6 : 2,
                phase: 'idle', timer: 0, hit: false, damage: family === 'reactor' ? 38 : 32 });
            grid.landmarks.push({ x, y: y - 2, title: `${spec.name}: ${spec.variants[variant]}`, color: spec.color, discovered: false });
        });

        // Проекты добавляют находки в свободные промежутки, не перезаписывая комплексы.
        const projectRooms = [];
        const addProjectRoom = (title, contents, bg, color) => {
            const candidates = [];
            for (let y = 18; y < rows - 9; y++) {
                if (![...grid.structures, ...projectRooms].some(room => y + 2 >= room.bounds.top && y - 2 <= room.bounds.bottom)) candidates.push(y);
            }
            if (!candidates.length) return;
            const y = pick(candidates);
            const x = Math.floor(cols / 2);
            projectRooms.push({ bounds: { top: y - 2, bottom: y + 2 } });
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    set(x + dx, y + dy, dy === 0 ? TILE_TYPES.EMPTY : (dx === 0 ? TILE_TYPES.DIRT : TILE_TYPES.STEEL_BEAM), bg);
                }
            }
            contents.forEach((proto, i) => set(x - Math.floor(contents.length / 2) + i, y, proto, bg));
            grid.landmarks.push({ x, y, title, color, discovered: false });
        };
        const projects = new Set(unlockedProjects);
        if (projects.has('STRUCT_CRYO_OASIS')) addProjectRoom('Крио-заправка «Оазис»', [TILE_TYPES.ENERGY_BLOCK, TILE_TYPES.OMEGA_MEDKIT, TILE_TYPES.ORE_VITALIUM], 'bunker', '#34d399');
        if (projects.has('STRUCT_MIDAS_VAULT')) addProjectRoom('Сокровищница Мидаса', [TILE_TYPES.ORE_QUARTZ, TILE_TYPES.STAR_RELIC, TILE_TYPES.ORE_QUARTZ], 'ruins', '#fde047');
        if (projects.has('STRUCT_OMEGA_LAB') && layerNumber >= 2) addProjectRoom('Лаборатория Предтеч «Омега»', [TILE_TYPES.TECH_POD, TILE_TYPES.STAR_RELIC, TILE_TYPES.TECH_POD, TILE_TYPES.CHRONO_SPHERE], 'ruins', '#c084fc');
        const free = [];
        for (let y = 12; y < rows - 8; y++) {
            for (let x = 2; x < cols - 2; x++) {
                if (!grid[y][x].bgType && !grid.structures.some(room => y >= room.bounds.top && y <= room.bounds.bottom)) free.push({ x, y });
            }
        }
        const placeFree = (proto) => {
            if (!free.length) return;
            const index = Math.floor(Math.random() * free.length);
            const { x, y } = free.splice(index, 1)[0];
            set(x, y, proto);
        };
        placeFree(TILE_TYPES.TECH_POD);
        placeFree(TILE_TYPES.TECH_POD);
        for (let i = 0; i < Math.floor(rows / 16); i++) placeFree(TILE_TYPES.OIL_VEIN);
        if (projects.has('RELIC_ITEMS_I')) { placeFree(TILE_TYPES.CHRONO_SPHERE); placeFree(TILE_TYPES.OMEGA_MEDKIT); }
        return grid;
    }
}
