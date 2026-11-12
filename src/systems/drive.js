/** Форсаж и направленный пробой породы; this — GameController. */
import { CONFIG } from '../data/config.js';

export class DriveSystem {
    triggerDriveBoost() {
        if (this.state !== 'PLAYING' || !this.drill.beginBoost(this)) return false;
        this.sound.playRocketLaunch();
        this.screenShake = Math.max(this.screenShake, 0.08);
        this.shockwaveRings.push({ x: (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE,
            y: (this.drill.visualY + 0.5) * CONFIG.TILE_SIZE, radius: 5,
            maxRadius: CONFIG.TILE_SIZE * 1.6, color: '34, 211, 238', life: 0.3, maxLife: 0.3 });
        this.spawnFloatingText(this.drill.visualX, this.drill.visualY - 0.5, 'ФОРСАЖ!', '#67e8f9', true);
        // Импульс расчищает короткий проход по направлению коронки через общую добычу.
        const facing = this.drill.facing;
        const vx = facing === 'left' ? -1 : (facing === 'right' ? 1 : 0);
        const vy = vx === 0 ? 1 : 0;
        for (let step = 1; step <= 2; step++) {
            for (let side = -1; side <= 1; side++) {
                if (this.state !== 'PLAYING') break;
                const x = this.drill.gridX + vx * step + vy * side;
                const y = this.drill.gridY + vy * step + vx * side;
                const tile = this.grid[y]?.[x];
                if (!tile || tile.isEmpty() || tile.proto.indestructible || tile.proto.isStation || tile.proto.isTechPod || tile.proto.isStructureConsole) continue;
                tile.hp -= CONFIG.BOOST_PULSE_DAMAGE;
                this.spawnParticles(x, y, '#67e8f9', 5, 110);
                if (tile.hp <= 0) this.destroyBlock(x, y, true);
            }
        }
        this.updateHUD();
        return true;
    }

}
