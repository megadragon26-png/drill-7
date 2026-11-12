/**
 * Цены и параметры улучшений шасси и постоянных слотов.
 */
export const CHASSIS_UPGRADES = {
    torque: {
        maxLevel: 6,
        costs: [90, 185, 310, 460, 640, 860],
        speedBonusPerLevel: 0.12 // +12% за уровень (макс +72%)
    },
    tank: {
        maxLevel: 6,
        costs: [80, 165, 280, 420, 590, 800],
        fuelBonusPerLevel: 25
    },
    armor: {
        maxLevel: 6,
        costs: [80, 165, 280, 420, 590, 800],
        hullBonusPerLevel: 25
    }
};

export const META_SLOT_COSTS = {
    3: 220,
    4: 480,
    5: 860
};
