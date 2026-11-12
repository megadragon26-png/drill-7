/**
 * Условия и описания комбинаций оборудования.
 */
export const SYNERGIES_CATALOG = [
    { id: 'ARC_NETWORK', name: 'Сеть разрядов', desc: 'Индукция + Дальняя дуга + Разветвитель: разряды ищут две цели в расширенной области.',
        check: drill => ['INDUCTION', 'LONG_ARC', 'ARC_SPLITTER'].every(id => drill.hasModifier(id)) },
    { id: 'MANUAL_CASCADE', name: 'Искровой проходчик', desc: 'Искровая коронка + Каскадный реактор: ручное бурение запускает усиленные цепи модификаторов.',
        check: drill => drill.hasModifier('MINING_SPARK') && drill.hasModifier('CHAIN_REACTOR') && ['INDUCTION', 'SHRAPNEL'].some(id => drill.hasModifier(id)) },
    { id: 'CRYO_REFINERY', name: 'Холодная переработка', desc: 'Криосепаратор + Криоконденсатор/Буран: замораживайте руду для дополнительной добычи.',
        check: drill => drill.hasModifier('COLD_SALVAGE') && (drill.hasModifier('CRYO') || drill.hasModule('FROST_NOVA')) },
    { id: 'FUEL_RECONSTRUCTION', name: 'Ремонт на заправке', desc: 'Регенеративный бак + Топливный катализатор: топливные клетки дополнительно лечат и заправляют.',
        check: drill => drill.hasModifier('FUEL_ARMOR') && drill.hasModifier('FUEL_CATALYST') },
    {
        id: 'FROZEN_CIRCUIT', name: 'Ледяная цепь',
        desc: 'Криоконденсатор + Хрупкость + Индукция/Осколки: заморозка утраивает урон импульсов по соседней породе.',
        check: drill => drill.hasModifier('CRYO') && drill.hasModifier('BRITTLE') && (drill.hasModifier('INDUCTION') || drill.hasModifier('SHRAPNEL'))
    },
    {
        id: 'ORE_RECOVERY', name: 'Восстановительная добыча',
        desc: 'Ремонтная пыль + Рудный теплообменник: каждая рудная клетка одновременно лечит и охлаждает.',
        check: drill => drill.hasModifier('ORE_NANITES') && drill.hasModifier('ORE_COOLANT')
    },
    {
        id: 'ORE_BARRAGE',
        name: 'Шквал Рудокопа',
        desc: 'Дроны/Магнит/Мидас + Пулемёт «Вулкан»: +2 бонусных снаряда при каждой добыче руды!',
        check: (drill) => drill.hasModule('ORE_GATLING') && (drill.hasModule('MINING_DRONE') || drill.hasModule('MAGNET_GRAB') || drill.hasModule('OMEGA_CONVERTER'))
    },
    {
        id: 'ETERNAL_PHOENIX',
        name: 'Вечный Реактор',
        desc: 'Нано-Ремкомплект «Феникс» + Газ-Реактор/Эко-Магнит: каждые 12 ед. потраченного топлива возвращают 2 топлива при срабатывании нанитов!',
        check: (drill) => drill.hasModule('FUEL_NANITES') && (drill.hasModule('GAS_FILTER') || drill.hasModule('MAGNET_GRAB'))
    },
    {
        id: 'FORTRESS_RETALIATION',
        name: 'Бастион Возмездия',
        desc: 'Броня «Бастион» + Щит-Буфер/Наниты: отражение или получение удара вызывает волну 5x5; разрушенная порода лечит до 4 HP (1 за клетку)!',
        check: (drill) => drill.hasModule('BLAST_ARMOR') && (drill.hasModule('TITAN_SHIELD') || drill.hasModule('FUEL_NANITES'))
    },
    {
        id: 'THERMAL_OVERDRIVE',
        name: 'Плазменный Форсаж',
        desc: 'Пиро-Реактор «Саламандра» + Лазеры/Гелиос/Ракеты: выстрелы разогревают реактор и дают +25% к урону оружия!',
        check: (drill) => drill.hasModule('THERMAL_AEGIS') && (drill.hasModule('SIDE_LASERS') || drill.hasModule('PLASMA_ANNIHILATOR') || drill.hasModule('ROCKET_POD'))
    },
    {
        id: 'CRYO_SHATTER',
        name: 'Ледяное Крошево',
        desc: 'Крио-Импульс «Буран» + Пилы «Жнец»/Мортира: ледяная порода получает двойной урон от пил и бомб!',
        check: (drill) => drill.hasModule('FROST_NOVA') && (drill.hasModule('SAW_BLADES') || drill.hasModule('SEISMO_MORTAR'))
    }
];
