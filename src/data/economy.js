/** Общие кривые длинного забега: плавный выход на предел без бесконечной инфляции. */
import { CONFIG } from './config.js';

export function getLayerHardnessScale(layer) {
    const depth = Math.max(1, Number.isFinite(layer) ? layer : 1);
    return 1 + Math.min(5, depth - 1) * 0.16 + 0.8 * (1 - Math.exp(-Math.max(0, depth - 6) / 16));
}

export function getLayerFuelDrain(layer) {
    const depth = Math.max(1, Number.isFinite(layer) ? layer : 1);
    return CONFIG.FUEL_DRAIN_PER_SEC + Math.min(5, depth - 1) * 0.12 + 0.7 * (1 - Math.exp(-Math.max(0, depth - 6) / 16));
}

export function getServiceQuote(current, maximum, layer) {
    const amount = Math.min(40, Math.max(0, Math.ceil(maximum - current)));
    const rate = (18 + Math.min(12, Math.max(0, layer - 1) * 1.5)) / 40;
    return { amount, cost: amount ? Math.ceil(amount * rate) : 0 };
}

export function getOreAllowance(layer) {
    return 180 + Math.min(5, Math.max(0, layer - 1)) * 60 + 120 * (1 - Math.exp(-Math.max(0, layer - 6) / 16));
}

export function getLayerDangerScale(layer) {
    return 1 + Math.min(0.75, Math.max(0, layer - 1) * 0.06);
}
