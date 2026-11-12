/**
 * Отрисовка бура, дронов и полос ресурсов над буром.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { MODULES_CATALOG } from '../data/modules.js';

export class DrillRenderer {
    renderOrbitingDrones(ctx, ts) {
        const droneLvl = this.drill.getModuleLevel('MINING_DRONE');
        if (droneLvl <= 0) return;
        const count = MODULES_CATALOG.MINING_DRONE.droneCount[droneLvl - 1];
        const cx = (this.drill.visualX + 0.5) * ts;
        const cy = (this.drill.visualY + 0.5) * ts;

        for (let d = 0; d < count; d++) {
            const angle = this.drill.droneOrbitAngle + d * Math.PI;
            const dx = Math.floor(cx + Math.cos(angle) * 28);
            const dy = Math.floor(cy + Math.sin(angle) * 22);

            ctx.fillStyle = '#064e3b';
            ctx.fillRect(dx - 6, dy - 5, 12, 10);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(dx - 4, dy - 3, 8, 6);
            ctx.fillStyle = '#a7f3d0';
            ctx.fillRect(dx - 2, dy - 1, 4, 2);
        }
    }

    renderOnDrillMiniHUD(ctx, ts) {
        const cx = (this.drill.visualX + 0.5) * ts;
        const topY = this.drill.visualY * ts - 15;
        const barW = 44;
        const x0 = cx - barW / 2;

        const hullPct = Math.max(0, Math.min(1, this.drill.hull / this.drill.maxHull));
        const fuelPct = Math.max(0, Math.min(1, this.drill.fuel / this.drill.maxFuel));

        ctx.fillStyle = 'rgba(7, 9, 15, 0.85)';
        ctx.fillRect(x0 - 2, topY - 2, barW + 4, 12);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x0, topY, barW, 4);
        ctx.fillStyle = hullPct > 0.35 ? '#10b981' : '#ef4444';
        ctx.fillRect(x0, topY, barW * hullPct, 4);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x0, topY + 5, barW, 4);
        ctx.fillStyle = fuelPct > 0.25 ? '#fbbf24' : '#f97316';
        ctx.fillRect(x0, topY + 5, barW * fuelPct, 4);
    }

    renderDrillSprite(ctx, ts) {
        const dx = Math.floor(this.drill.visualX * ts);
        const dy = Math.floor(this.drill.visualY * ts);
        const vib = this.drill.isDrilling ? (Math.sin(this.drill.drillAnimPhase) * 2) : 0;

        ctx.save();
        ctx.translate(dx + vib, dy);
        if (this.drill.boostTimer > 0) {
            ctx.fillStyle = '#0891b2';
            ctx.fillRect(6, -12, 6, 22);
            ctx.fillRect(ts - 12, -12, 6, 22);
            ctx.fillStyle = '#a5f3fc';
            ctx.fillRect(8, -18 + Math.sin(this.drill.drillAnimPhase) * 3, 2, 22);
            ctx.fillRect(ts - 10, -18 + Math.cos(this.drill.drillAnimPhase) * 3, 2, 22);
            ctx.strokeStyle = '#67e8f9';
            ctx.lineWidth = 2;
            ctx.strokeRect(-3, -2, ts + 6, ts + 4);
        }
        if (this.drill.flowStacks > 0) {
            ctx.fillStyle = '#22d3ee';
            for (let i = 0; i < this.drill.flowStacks; i++) ctx.fillRect(8 + i * 6, -5, 4, 3);
        }

        // Конусный луч прожектора бура (освещает путь вперед!)
        ctx.save();
        const beamGrad = ctx.createRadialGradient(ts / 2, ts / 2, 6, ts / 2, ts / 2, ts * 2.8);
        beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.30)');
        beamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.14)');
        beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.arc(ts / 2, ts / 2, ts * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Энергетический купол Титанового Щита-Буфера
        if (this.drill.hasModule('TITAN_SHIELD') && this.drill.shieldReady) {
            ctx.strokeStyle = 'rgba(129, 140, 248, 0.92)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(ts / 2, ts / 2, ts * 0.56, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Реактивное пламя сверху при бурении
        if (this.drill.isDrilling) {
            ctx.fillStyle = '#f97316';
            ctx.fillRect(14, -3, 5, 5);
            ctx.fillRect(ts - 19, -3, 5, 5);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(15, -1, 3, 3);
            ctx.fillRect(ts - 18, -1, 3, 3);
        }

        // Гусеницы с металлическими траками
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(2, 5, 7, 23);
        ctx.fillRect(ts - 9, 5, 7, 23);
        ctx.fillStyle = '#94a3b8';
        for (let t = 7; t < 26; t += 4) {
            ctx.fillRect(3, t, 5, 2);
            ctx.fillRect(ts - 8, t, 5, 2);
        }

        // Корпус (яркий индустриальный золотисто-оранжевый или плазменно-красный при перегреве)
        ctx.fillStyle = this.drill.isOverheated() ? '#dc2626' : '#ea580c';
        ctx.fillRect(8, 4, ts - 16, 23);
        ctx.fillStyle = this.drill.isOverheated() ? '#fca5a5' : '#fbbf24';
        ctx.fillRect(10, 6, ts - 20, 18);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(11, 6, ts - 22, 3);

        // Панорамное неоновое стекло кабины
        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(11, 10, ts - 22, 8);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(12, 11, ts - 24, 5);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(13, 12, ts - 28, 2);

        // Пусковые установки ракет/лазеров на корпусе
        if (this.drill.hasModule('ROCKET_POD')) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(9, 1, 7, 4);
            ctx.fillRect(ts - 16, 1, 7, 4);
        }
        if (this.drill.hasModule('SIDE_LASERS')) {
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(0, 14, 4, 6);
            ctx.fillRect(ts - 4, 14, 4, 6);
        }

        // Хромированная коронка бура со спиральными насечками
        const bitOffset = this.drill.isDrilling ? Math.abs(Math.sin(this.drill.drillAnimPhase)) * 3.5 : 0;
        const bitMain = this.drill.chassisLevels.torque >= 2 ? '#38bdf8' : '#e2e8f0';
        const bitHighlight = '#ffffff';

        if (this.drill.facing === 'down') {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(9, 27, ts - 18, 3);
            ctx.fillStyle = bitMain;
            ctx.fillRect(12, 30, ts - 24, 5 + bitOffset * 0.5);
            ctx.fillStyle = bitHighlight;
            ctx.fillRect(16, 35, ts - 32, 5 + bitOffset);
        } else if (this.drill.facing === 'left') {
            ctx.fillStyle = bitMain;
            ctx.fillRect(2 - bitOffset, 11, 6, 13);
            ctx.fillStyle = bitHighlight;
            ctx.fillRect(-1 - bitOffset, 14, 4, 7);
        } else if (this.drill.facing === 'right') {
            ctx.fillStyle = bitMain;
            ctx.fillRect(ts - 8 + bitOffset, 11, 6, 13);
            ctx.fillStyle = bitHighlight;
            ctx.fillRect(ts - 3 + bitOffset, 14, 4, 7);
        }

        ctx.restore();
    }
}
