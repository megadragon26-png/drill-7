/**
 * Прототипы пород, руд, опасностей и интерактивных блоков.
 */
export const TILE_TYPES = {
    STRUCTURE_CONSOLE: { id: 41, name: 'Тайник комплекса — автоматический подбор', hp: 24, fuelCost: 0.3, heatGen: 0, solid: true, isStructureConsole: true, color: '#0e7490', glowColor: '34, 211, 238' },
    EMPTY: { id: 0, name: 'Пустота', hp: 0, fuelCost: 0, heatGen: 0, solid: false },

    DIRT: { id: 1, name: 'Терракотовый Грунт', hp: 28, fuelCost: 0.65, heatGen: 1.4, solid: true, color: '#b4693e' },
    CLAY: { id: 2, name: 'Янтарная Глина', hp: 44, fuelCost: 0.95, heatGen: 2.2, solid: true, color: '#c97a3e' },
    LIMESTONE: { id: 3, name: 'Голубой Известняк', hp: 68, fuelCost: 1.35, heatGen: 3.8, solid: true, isHard: true, color: '#52799c' },
    CRYSTAL_SHALE: { id: 4, name: 'Сапфировый Сланец', hp: 105, fuelCost: 1.85, heatGen: 5.8, solid: true, isHard: true, color: '#2b5b8c' },
    MAGMA_BASALT: { id: 5, name: 'Вулканический Базальт', hp: 155, fuelCost: 2.35, heatGen: 10.2, solid: true, isHard: true, color: '#7a2338' },
    BEDROCK: { id: 6, name: 'Обшивка Шахты', hp: 999999, fuelCost: 0, heatGen: 0, solid: true, indestructible: true, color: '#334155' },

    // Новые породы для расширенной кампании (Слои 2, 4 и 6)
    SPORE_ROCK: { id: 28, name: 'Споровый Известняк', hp: 58, fuelCost: 1.15, heatGen: 2.8, solid: true, color: '#3f6212' },
    ABYSS_STONE: { id: 29, name: 'Абиссальный Базальт', hp: 130, fuelCost: 2.05, heatGen: 6.4, solid: true, isHard: true, color: '#1e3a8a' },
    NEUTRONIUM: { id: 30, name: 'Сверхплотный Нейтрониум', hp: 210, fuelCost: 2.75, heatGen: 12.5, solid: true, isHard: true, color: '#3b0764' },
    PERMAFROST_ICE: { id: 35, name: 'Вечная Мерзлота', hp: 62, fuelCost: 1.10, heatGen: -3.5, solid: true, color: '#0284c7' },
    MAGNETITE_ROCK: { id: 36, name: 'Магнетитовый Сланец', hp: 96, fuelCost: 1.65, heatGen: 4.5, solid: true, isHard: true, color: '#312e81' },
    RUSTED_HULL: { id: 37, name: 'Ржавая Обшивка Титана', hp: 138, fuelCost: 1.95, heatGen: 5.5, solid: true, isHard: true, oreValue: 6, color: '#7c2d12' },

    // Топливо (снижено для более напряженного менеджмента)
    OIL_VEIN: { id: 7, name: 'Нефтяная Жила', hp: 30, fuelCost: 0.50, heatGen: 0, solid: true, fuelGain: 20, glowColor: '251, 191, 36', color: '#fbbf24' },
    ENERGY_BLOCK: { id: 8, name: 'Энергоблок', hp: 42, fuelCost: 0.60, heatGen: -18, solid: true, fuelGain: 30, glowColor: '16, 185, 129', color: '#10b981' },

    // Руды
    ORE_COAL: { id: 9, name: 'Уголь', hp: 36, fuelCost: 0.75, heatGen: 1.6, solid: true, oreValue: 9, fuelGain: 7, glowColor: '251, 146, 60', color: '#fb923c' },
    ORE_IRON: { id: 10, name: 'Железная Руда', hp: 54, fuelCost: 1.10, heatGen: 2.6, solid: true, oreValue: 15, glowColor: '249, 115, 22', color: '#f97316' },
    ORE_COBALT: { id: 31, name: 'Кобальтовая Жила', hp: 72, fuelCost: 1.35, heatGen: 3.4, solid: true, isHard: true, oreValue: 22, glowColor: '52, 211, 153', color: '#10b981' },
    ORE_QUARTZ: { id: 11, name: 'Кварц', hp: 86, fuelCost: 1.55, heatGen: 4.4, solid: true, isHard: true, oreValue: 28, glowColor: '34, 211, 238', color: '#22d3ee' },
    ORE_AMETHYST: { id: 12, name: 'Аметист', hp: 110, fuelCost: 1.90, heatGen: 5.2, solid: true, isHard: true, oreValue: 42, glowColor: '192, 132, 252', color: '#c084fc' },
    ORE_TITANITE: { id: 13, name: 'Титанит', hp: 145, fuelCost: 2.25, heatGen: 7.5, solid: true, isHard: true, oreValue: 62, glowColor: '244, 114, 182', color: '#f472b6' },
    ORE_CORE: { id: 14, name: 'Ядро-Кристалл', hp: 180, fuelCost: 2.65, heatGen: 9.5, solid: true, isHard: true, oreValue: 90, glowColor: '251, 113, 133', color: '#fb7185' },
    ORE_AETHERIUM: { id: 32, name: 'Реликтовый Эфириум', hp: 230, fuelCost: 3.00, heatGen: 11.5, solid: true, isHard: true, oreValue: 135, glowColor: '250, 204, 21', color: '#fde047' },
    OBSIDIAN: { id: 19, name: 'Застывший Обсидиан', hp: 52, fuelCost: 0.90, heatGen: -10, solid: true, oreValue: 28, glowColor: '129, 140, 248', color: '#818cf8' },
    ORE_VITALIUM: { id: 21, name: 'Виталиум (Живая Руда)', hp: 48, fuelCost: 0.75, heatGen: -10, solid: true, hullGain: 8, oreValue: 18, glowColor: '251, 113, 133', color: '#fb7185' },

    // Опасности (включая уникальные ловушки альтернативных слоев)
    GAS_POCKET: { id: 15, name: 'Газ под давлением', hp: 26, fuelCost: 0.65, heatGen: 2.5, solid: true, hazard: 'gas', damage: 44, glowColor: '163, 230, 53', color: '#84cc16' },
    UNSTABLE_ROCK: { id: 16, name: 'Падающий Валун', hp: 72, fuelCost: 1.50, heatGen: 3.2, solid: true, fallingHazard: true, damage: 46, color: '#94a3b8' },
    THERMAL_POCKET: { id: 17, name: 'Карман Лавы', hp: 56, fuelCost: 1.35, heatGen: 38.0, solid: true, hazard: 'lava', damage: 42, glowColor: '239, 68, 68', color: '#ef4444' },
    ACID_POCKET: { id: 33, name: 'Кислотный Карман', hp: 38, fuelCost: 0.95, heatGen: 8.0, solid: true, hazard: 'acid', damage: 34, fuelDrain: 14, glowColor: '74, 222, 128', color: '#22c55e' },
    VOID_POCKET: { id: 34, name: 'Аномалия Пустоты', hp: 78, fuelCost: 1.65, heatGen: 26.0, solid: true, hazard: 'void', damage: 54, glowColor: '192, 132, 252', color: '#9333ea' },
    CRYO_TRAP: { id: 38, name: 'Крио-Осколок Холода', hp: 42, fuelCost: 0.90, heatGen: -30.0, solid: true, hazard: 'cryo', damage: 28, glowColor: '56, 189, 248', color: '#38bdf8' },
    ELECTRO_NODE: { id: 39, name: 'Электро-Конденсатор', hp: 52, fuelCost: 1.15, heatGen: 14.0, solid: true, hazard: 'electro', damage: 38, glowColor: '250, 204, 21', color: '#eab308' },
    ARC_MINE: { id: 40, name: 'Реакторная Мина Древних', hp: 64, fuelCost: 1.35, heatGen: 22.0, solid: true, hazard: 'mine', damage: 52, glowColor: '249, 115, 22', color: '#ea580c' },

    // Интерактивные объекты и блоки подземных построек
    STATION_GATE: { id: 18, name: 'Шлюз Станции', hp: 10, fuelCost: 0, heatGen: 0, solid: false, isStation: true, color: '#06b6d4' },
    TECH_POD: { id: 20, name: 'Сундук-Капсула Модулей', hp: 34, fuelCost: 0.45, heatGen: 0, solid: true, isTechPod: true, glowColor: '56, 189, 248', color: '#38bdf8' },
    STEEL_BEAM: { id: 22, name: 'Стальная Опора Бункера', hp: 160, fuelCost: 1.75, heatGen: 4.2, solid: true, isHard: true, oreValue: 8, color: '#64748b' },
    ANCIENT_BRICK: { id: 23, name: 'Плита Древних Руин', hp: 195, fuelCost: 2.05, heatGen: 5.0, solid: true, isHard: true, oreValue: 14, glowColor: '129, 140, 248', color: '#4f46e5' },
    SUPPLY_CRATE: { id: 24, name: 'Ящик Снабжения', hp: 26, fuelCost: 0.35, heatGen: -8, solid: true, isSupplyCrate: true, fuelGain: 16, hullGain: 3, oreValue: 28, glowColor: '245, 158, 11', color: '#f59e0b' },

    // НОВЫЕ ПОЛОЖИТЕЛЬНЫЕ ПРЕДМЕТЫ И АРТЕФАКТЫ
    CHRONO_SPHERE: { id: 25, name: 'Хроно-Сфера «Эфир»', hp: 28, fuelCost: 0.25, heatGen: -25, solid: true, isChronoSphere: true, chronoDuration: 7.0, oreValue: 22, glowColor: '56, 189, 248', color: '#38bdf8' },
    OMEGA_MEDKIT: { id: 26, name: 'Нано-Капсула «Абсолют»', hp: 28, fuelCost: 0.25, heatGen: -100, solid: true, isOmegaMedkit: true, hullGain: 18, fuelGain: 20, glowColor: '52, 211, 153', color: '#10b981' },
    STAR_RELIC: { id: 27, name: 'Звёздная Реликвия Предтеч', hp: 44, fuelCost: 0.40, heatGen: -30, solid: true, isStarRelic: true, oreValue: 90, bankBonus: 35, glowColor: '250, 204, 21', color: '#facc15' }
};
