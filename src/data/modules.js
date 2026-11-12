/**
 * Каталог оборудования: баланс, уровни, цены, описания.
 */
export const MODULES_CATALOG = {
    // === ОБЫЧНЫЕ МОДУЛИ (Высокий шанс выпадения, недорогая прокачка) ===
    SIDE_LASERS: {
        id: 'SIDE_LASERS',
        rarity: 'COMMON',
        category: 'Оружие',
        catColor: 'text-rose-400',
        name: 'Боковые Лазеры «Луч-2»',
        shortName: 'ЛАЗЕРЫ',
        isActiveTimer: true,
        cooldowns: [2.23, 1.8, 1.37],
        pierceRange: [1, 2, 2],
        descByLvl: [
            'Каждые 2.23с наносит лазерный удар по 1 блоку слева и справа.',
            'Каждые 1.8с прожигает по 2 блока слева и справа от бура.',
            'Каждые 1.37с мощный луч вскрывает боковые жилы по 2 блока!'
        ],
        unlockedByDefault: true,
        unlockCost: 0,
        buyCost: 65,
        upgradeCosts: [95, 175]
    },
    GAS_FILTER: {
        id: 'GAS_FILTER',
        rarity: 'COMMON',
        category: 'Синергия',
        catColor: 'text-lime-300',
        name: 'Фильтр-Реактор Газа',
        shortName: 'ГАЗ-РЕАКТОР',
        isActiveTimer: false,
        fuelBonus: [16, 24, 32],
        bonusRockets: [1, 1, 2],
        descByLvl: [
            'Газ под давлением НЕ взрывается, а дает +16 Топлива и пускает 1 ракету!',
            'Газ дает +24 Топлива, +12 Руды и выпускает 1 боевую ракету.',
            'Газ дает +32 Топлива, +18 Руды и залп из 2 самонаводящихся ракет!'
        ],
        unlockedByDefault: true,
        unlockCost: 0,
        buyCost: 60,
        upgradeCosts: [90, 165]
    },
    MAGNET_GRAB: {
        id: 'MAGNET_GRAB',
        rarity: 'COMMON',
        category: 'Экономика',
        catColor: 'text-yellow-300',
        name: 'Эко-Инжектор Контур',
        shortName: 'ЭКО-МАГНИТ',
        isActiveTimer: false,
        oreMult: [1.20, 1.35, 1.50],
        fuelSave: [0.16, 0.25, 0.34],
        descByLvl: [
            '+20% больше Руды со всех жил и -16% расход топлива.',
            '+35% больше Руды, -25% расход топлива и широкий радар.',
            '+50% больше Руды со всех источников и -34% расход топлива!'
        ],
        unlockedByDefault: true,
        unlockCost: 0,
        buyCost: 70,
        upgradeCosts: [105, 185]
    },

    // === РЕДКИЕ МОДУЛИ (Средний шанс выпадения, средняя цена апгрейдов) ===
    TESLA_COIL: {
        id: 'TESLA_COIL',
        rarity: 'RARE',
        category: 'Оружие',
        catColor: 'text-cyan-300',
        name: 'Тесла-Катушка «Гром»',
        shortName: 'ТЕСЛА',
        isActiveTimer: true,
        cooldowns: [2.74, 2.23, 1.8],
        targetsCount: [2, 3, 4],
        descByLvl: [
            'Каждые 2.74с бьет молнией по 2 блокам вокруг и обезвреживает Газ.',
            'Каждые 2.23с бьет цепной молнией по 3 блокам вокруг.',
            'Каждые 1.8с поражает молниями 4 блока вокруг бура!'
        ],
        unlockedByDefault: true,
        unlockCost: 0,
        buyCost: 95,
        upgradeCosts: [145, 255]
    },
    BLAST_ARMOR: {
        id: 'BLAST_ARMOR',
        rarity: 'COMMON',
        category: 'Защита',
        catColor: 'text-emerald-300',
        name: 'Демпферная Броня «Бастион»',
        shortName: 'БАСТИОН',
        isActiveTimer: false,
        dmgReduction: [0.20, 0.32, 0.45],
        descByLvl: [
            '-20% урона от взрывов газа и обвалов + ответная волна 3x3 при ударе.',
            '-32% урона от взрывов и камней + ответная волна дробит породу в руду!',
            '-45% урона от взрывов газа, камней и тектоники + мощный контр-импульс!'
        ],
        unlockedByDefault: true,
        unlockCost: 0,
        buyCost: 65,
        upgradeCosts: [95, 175]
    },
    FUEL_NANITES: {
        id: 'FUEL_NANITES',
        rarity: 'RARE',
        category: 'Регенерация',
        catColor: 'text-rose-300',
        name: 'Нано-Ремкомплект «Феникс»',
        shortName: 'ФЕНИКС',
        isActiveTimer: false,
        healPerFuelChunk: [2, 3, 4],
        descByLvl: [
            'Каждые 12 ед. потраченного топлива восстанавливают до 2 HP (общая пауза ремонта 1.25с).',
            'Каждые 12 ед. топлива восстанавливают до 3 HP и снимают 4 Нагрева (пауза 1.25с).',
            'Каждые 12 ед. топлива восстанавливают до 4 HP и снимают 4 Нагрева (пауза 1.25с).'
        ],
        unlockedByDefault: true,
        unlockCost: 0,
        buyCost: 90,
        upgradeCosts: [140, 245]
    },
    ORE_GATLING: {
        id: 'ORE_GATLING',
        rarity: 'RARE',
        category: 'Синергия Руды',
        catColor: 'text-amber-300',
        name: 'Рудный Пулемёт «Вулкан»',
        shortName: 'ВУЛКАН',
        isActiveTimer: false,
        shellsCount: [2, 3, 4],
        descByLvl: [
            'Добыча любой руды автоматически выпускает 2 бронебойных снаряда вниз!',
            'Добыча руды выпускает веер из 3 бронебойных снарядов по породе.',
            'Добыча руды выпускает шквал из 4 разрывных снарядов вниз!'
        ],
        unlockedByDefault: false,
        unlockCost: 120,
        buyCost: 95,
        upgradeCosts: [150, 260]
    },
    FROST_NOVA: {
        id: 'FROST_NOVA',
        rarity: 'RARE',
        category: 'Крио-Волна',
        catColor: 'text-sky-300',
        name: 'Крио-Импульс «Буран»',
        shortName: 'БУРАН',
        isActiveTimer: true,
        cooldowns: [3.46, 2.81, 2.23],
        heatClear: [34, 48, 68],
        descByLvl: [
            'Каждые 3.46с пускает крио-волну: сбивает Нагрев и превращает Лаву в Обсидиан.',
            'Каждые 2.81с крио-волна замораживает лаву и гасит извержения вокруг.',
            'Каждые 2.23с ледяной шторм охлаждает бур и замораживает породу!'
        ],
        unlockedByDefault: false,
        unlockCost: 135,
        buyCost: 100,
        upgradeCosts: [155, 270]
    },
    SEISMO_MORTAR: {
        id: 'SEISMO_MORTAR',
        rarity: 'RARE',
        category: 'Оружие',
        catColor: 'text-amber-400',
        name: 'Сейсмо-Мортира «Крот»',
        shortName: 'МОРТИРА',
        isActiveTimer: true,
        cooldowns: [3.31, 2.74, 2.23],
        bombsCount: [1, 2, 2],
        descByLvl: [
            'Каждые 3.31с бросает вниз прыгающую сейсмо-бомбу.',
            'Каждые 2.74с бросает 2 кассетные сейсмо-бомбы вниз.',
            'Каждые 2.23с бросает 2 усиленные глубинные сейсмо-бомбы!'
        ],
        unlockedByDefault: false,
        unlockCost: 130,
        buyCost: 105,
        upgradeCosts: [160, 280]
    },

    // === ЭПИЧЕСКИЕ МОДУЛИ (Малый шанс выпадения, дорогие улучшения) ===
    ROCKET_POD: {
        id: 'ROCKET_POD',
        rarity: 'EPIC',
        category: 'Оружие',
        catColor: 'text-orange-400',
        name: 'Ракетница «Залп»',
        shortName: 'РАКЕТЫ',
        isActiveTimer: true,
        cooldowns: [2.88, 2.38, 1.87],
        missilesCount: [2, 3, 4],
        descByLvl: [
            'Каждые 2.88с пускает 2 самонаводящиеся ракеты по руде и опасностям.',
            'Каждые 2.38с пускает 3 самонаводящиеся ракеты (взрыв 3x3).',
            'Каждые 1.87с пускает сокрушительный залп из 4 тактических ракет!'
        ],
        unlockedByDefault: true,
        unlockCost: 0,
        buyCost: 135,
        upgradeCosts: [215, 375]
    },
    MINING_DRONE: {
        id: 'MINING_DRONE',
        rarity: 'EPIC',
        category: 'Авто-Дрон',
        catColor: 'text-emerald-300',
        name: 'Дрон-Рудокоп «Шмель»',
        shortName: 'ДРОНЫ',
        isActiveTimer: true,
        cooldowns: [1.33, 1.01, 0.72],
        droneCount: [1, 2, 2],
        descByLvl: [
            'Вокруг бура летает 1 дрон и прицельно выжигает руду, ящики и нефть.',
            'Вокруг бура летают 2 автономных дрона-рудокопа!',
            '2 турбо-дрона молниеносно вскрывают руду и сундуки вокруг!'
        ],
        unlockedByDefault: false,
        unlockCost: 185,
        buyCost: 145,
        upgradeCosts: [225, 390]
    },
    TITAN_SHIELD: {
        id: 'TITAN_SHIELD',
        rarity: 'EPIC',
        category: 'Защита',
        catColor: 'text-indigo-300',
        name: 'Титановый Щит-Буфер',
        shortName: 'ЩИТ-БУФЕР',
        isActiveTimer: true,
        cooldowns: [13.5, 10.0, 7.2],
        descByLvl: [
            'Энерго-купол полностью блокирует 1 взрыв, камнепад или извержение.',
            'Перезарядка щита 10с + снижает проходящий урон на 15%.',
            'Перезарядка 7.2с + при отражении удара выпускает 2 ответные ракеты!'
        ],
        unlockedByDefault: false,
        unlockCost: 195,
        buyCost: 140,
        upgradeCosts: [220, 380]
    },
    SAW_BLADES: {
        id: 'SAW_BLADES',
        rarity: 'EPIC',
        category: 'Разрушение',
        catColor: 'text-teal-300',
        name: 'Циркулярные Пилы «Жнец»',
        shortName: 'ПИЛЫ',
        isActiveTimer: true,
        cooldowns: [3.02, 2.45, 1.94],
        bounces: [2, 3, 4],
        descByLvl: [
            'Каждые 3.02с пускает в обе стороны дисковые пилы (рикошетят от стен 2 раза).',
            'Каждые 2.45с пилы рикошетят 3 раза, прорезая целые ряды породы и руды!',
            'Каждые 1.94с плазменные пилы (4 рикошета) шинкуют шахту и ловушки!'
        ],
        unlockedByDefault: false,
        unlockCost: 175,
        buyCost: 140,
        upgradeCosts: [215, 375]
    },
    THERMAL_AEGIS: {
        id: 'THERMAL_AEGIS',
        rarity: 'EPIC',
        category: 'Защита / Жар',
        catColor: 'text-orange-300',
        name: 'Пиро-Реактор «Саламандра»',
        shortName: 'САЛАМАНДРА',
        isActiveTimer: false,
        lavaReduction: [0.25, 0.40, 0.55],
        cdrBonus: [0.28, 0.44, 0.60],
        descByLvl: [
            '-25% урона от Лавы. Нагрев >30% ускоряет перезарядку ВСЕХ модулей на +28%!',
            '-40% урона от Лавы и Извержений + ускорение перезарядки модулей на +44%!',
            '-55% урона от Лавы, отмена штрафа перегрева и +60% к скорости оружия!'
        ],
        unlockedByDefault: false,
        unlockCost: 180,
        buyCost: 135,
        upgradeCosts: [210, 365]
    },

    // === ЛЕГЕНДАРНЫЕ МОДУЛИ (Крайне редкие реликвии глубин, самая высокая цена прокачки) ===
    PLASMA_ANNIHILATOR: {
        id: 'PLASMA_ANNIHILATOR',
        rarity: 'LEGENDARY',
        category: 'Сверхоружие',
        catColor: 'text-amber-300',
        name: 'Плазма-Луч «Гелиос»',
        shortName: 'ГЕЛИОС',
        isActiveTimer: true,
        cooldowns: [3.89, 3.17, 2.52],
        beamDepth: [4, 5, 6],
        descByLvl: [
            'Каждые 3.89с бьет под буром столбом солнечной плазмы на 4 клетки вглубь!',
            'Каждые 3.17с прожигает шахту на 5 клеток вниз и дает +25% к добыче руды луча.',
            'Каждые 2.52с аннигилирует породу на 6 клеток вниз широким лучом!'
        ],
        unlockedByDefault: false,
        unlockCost: 280,
        buyCost: 195,
        upgradeCosts: [310, 540]
    },
    GRAV_SINGULARITY: {
        id: 'GRAV_SINGULARITY',
        rarity: 'LEGENDARY',
        category: 'Сингулярность',
        catColor: 'text-fuchsia-300',
        name: 'Грави-Ядро «Коллапс»',
        shortName: 'КОЛЛАПС',
        isActiveTimer: true,
        cooldowns: [4.18, 3.38, 2.74],
        descByLvl: [
            'Каждые 4.18с создает мини-черную дыру: дробит породу в радиусе 5x5 и собирает руду.',
            'Каждые 3.38с грави-волна 5x5 сокрушает блоки и возвращает до 8 Топлива за разрушенную породу (2 за клетку).',
            'Каждые 2.74с мощный грави-взрыв 5x5 вскрывает жилы и возвращает до 12 Топлива за разрушенную породу (2 за клетку)!'
        ],
        unlockedByDefault: false,
        unlockCost: 310,
        buyCost: 210,
        upgradeCosts: [330, 580]
    },
    OMEGA_CONVERTER: {
        id: 'OMEGA_CONVERTER',
        rarity: 'LEGENDARY',
        category: 'Алхимия',
        catColor: 'text-yellow-300',
        name: 'Алхимическое Ядро «Мидас»',
        shortName: 'МИДАС',
        isActiveTimer: true,
        cooldowns: [3.46, 2.81, 2.23],
        transmuteCount: [2, 3, 4],
        descByLvl: [
            'Каждые 3.46с превращает 2 блока породы/ловушек вокруг в Кварц, Нефть или Виталиум!',
            'Каждые 2.81с превращает 3 блока в ценные жилы и бьет по ним золотым лучом!',
            'Каждые 2.23с трансмутирует 4 блока вокруг в богатые самоцветы и Виталиум!'
        ],
        unlockedByDefault: false,
        unlockCost: 295,
        buyCost: 205,
        upgradeCosts: [320, 560]
    }
};
