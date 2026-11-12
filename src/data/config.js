/**
 * Основные параметры симуляции. LAYER_ROWS изменяет генератор уровня.
 */
export const CONFIG = {
    TILE_SIZE: 44,
    GRID_COLS: 15,
    LAYER_ROWS: 95, // Динамически перезаписывается длиной текущего слоя (95..200 м)
    GRAVITY_SPEED: 11,
    MOVE_COOLDOWN: 0.07,
    SLIDE_SPEED: 20,
    FUEL_DRAIN_PER_SEC: 2.38, // Повышенный посекундный расход топлива реактора на уровне для напряженного выживания
    BASE_MAX_FUEL: 100,
    BASE_MAX_HULL: 100,
    BASE_DRILL_POWER: 105,
    BOOST_DURATION: 2,
    BOOST_COOLDOWN: 8,
    BOOST_FUEL_COST: 6,
    BOOST_HEAT: 18,
    BOOST_POWER_MULTIPLIER: 2.4,
    BOOST_PULSE_DAMAGE: 120,
    FLOW_DURATION: 2.5,
    FLOW_MAX_STACKS: 5,
    FLOW_POWER_PER_STACK: 0.08,
    START_MODULE_SLOTS: 2,
    MAX_MODULE_SLOTS: 5,
    OVERHEAT_THRESHOLD: 72,
    PASSIVE_COOL_RATE: 9.8,
    LIGHT_RADIUS: 8.5,
    GAS_PRESSURE_LIMIT: 2.9 // Газ под давлением детонирует быстрее, если стоять вплотную без фильтра
};
