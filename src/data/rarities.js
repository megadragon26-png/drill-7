/**
 * Редкость: веса выпадения и оформление карточек.
 */
export const RARITY_TIERS = {
    COMMON: {
        id: 'COMMON',
        name: 'Обычный',
        dropWeight: 56,
        textColor: 'text-slate-100',
        badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
        glowColor: 'rgba(148, 163, 184, 0.15)'
    },
    RARE: {
        id: 'RARE',
        name: 'Редкий',
        dropWeight: 30,
        textColor: 'text-cyan-300',
        badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-500/60',
        glowColor: 'rgba(34, 211, 238, 0.22)'
    },
    EPIC: {
        id: 'EPIC',
        name: 'Эпический',
        dropWeight: 14,
        textColor: 'text-purple-300',
        badgeBg: 'bg-purple-950 text-purple-300 border-purple-500/60',
        glowColor: 'rgba(192, 132, 252, 0.28)'
    },
    LEGENDARY: {
        id: 'LEGENDARY',
        name: 'Легендарный',
        dropWeight: 6,
        textColor: 'text-amber-300',
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-400/80',
        glowColor: 'rgba(251, 191, 36, 0.35)'
    }
};
