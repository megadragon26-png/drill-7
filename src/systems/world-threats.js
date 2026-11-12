/** Защитные зоны комплексов и опасный нагрев. Методы работают на GameController. */
export class WorldThreats {
    updateWorldThreats(dt) {
        if (this.state !== 'PLAYING') return;
        const drill = this.drill;
        for (const threat of this.grid.threats || []) {
            if (this.state !== 'PLAYING') break;
            const cx = drill.visualX + 0.5;
            const cy = drill.visualY + 0.5;
            const near = cx >= threat.x - 5 && cx <= threat.x + threat.width + 5
                && cy >= threat.y - 5 && cy <= threat.y + threat.height + 5;
            if (threat.phase === 'idle') {
                if (!near) continue;
                threat.phase = 'warning';
                threat.timer = 1.1;
                threat.hit = false;
            } else {
                threat.timer -= dt;
                if (threat.timer <= 0) {
                    if (threat.phase === 'warning') {
                        threat.phase = 'active'; threat.timer = 0.75;
                        this.sound.playLaserPulse();
                    } else if (threat.phase === 'active') {
                        threat.phase = 'cooldown'; threat.timer = 3.2;
                    } else threat.phase = 'idle';
                }
            }
            if (threat.phase === 'active' && !threat.hit && cx >= threat.x && cx < threat.x + threat.width && cy >= threat.y && cy < threat.y + threat.height) {
                threat.hit = true;
                const source = threat.kind === 'heat' ? 'lava' : (threat.kind === 'collapse' ? 'rock' : (threat.kind === 'pressure' ? 'gas' : 'tectonic'));
                const damage = drill.takeDamage(threat.damage, source);
                if (threat.kind === 'cryo') drill.cryoSlowTimer = Math.max(drill.cryoSlowTimer, 1.5);
                this.triggerDamageFeedback(drill.gridX, drill.gridY, damage, 'Защитная система комплекса!', 'Уходите из мигающей зоны до её активации.', source);
            }
        }
        if (this.state !== 'PLAYING') return;
        if (drill.heat < 95) drill.overheatDamageTimer = 0;
        else {
            drill.overheatDamageTimer += dt;
            if (drill.overheatDamageTimer >= 1.25) {
                drill.overheatDamageTimer -= 1.25;
                const damage = drill.takeDamage(8, 'lava');
                this.triggerDamageFeedback(drill.gridX, drill.gridY, damage, 'Критический нагрев корпуса!', 'Снизьте нагрев ниже 95%: отпустите бурение или найдите охлаждение.', 'overheat');
            }
        }
    }

    renderWorldThreats(ctx, ts, startRow, endRow) {
        ctx.save();
        for (const threat of this.grid.threats || []) {
            if (threat.y > endRow || threat.y + threat.height < startRow) continue;
            const x = threat.x * ts;
            const y = threat.y * ts;
            const w = threat.width * ts;
            const h = threat.height * ts;
            const active = threat.phase === 'active';
            const warning = threat.phase === 'warning';
            ctx.strokeStyle = active ? '#f87171' : (warning ? '#fbbf24' : '#64748b');
            ctx.lineWidth = active ? 4 : 2;
            ctx.fillStyle = active ? 'rgba(239,68,68,.38)' : (warning ? 'rgba(251,191,36,.16)' : 'rgba(100,116,139,.05)');
            ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
            ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
            for (let offset = 10; offset < w - 4; offset += 18) {
                ctx.beginPath(); ctx.moveTo(x + offset, y + 5); ctx.lineTo(x + offset + 7, y + 14); ctx.stroke();
            }
            if (warning || active) {
                const names = { heat: 'ЖАР', laser: 'ЛАЗЕР', electric: 'РАЗРЯД', cryo: 'КРИО', pressure: 'ДАВЛЕНИЕ', collapse: 'ОБВАЛ' };
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#0c1324';
                ctx.fillRect(x + w / 2 - 53, y - 16, 106, 15);
                ctx.fillStyle = active ? '#fecaca' : '#fde68a';
                ctx.fillText(`${names[threat.kind]} ${warning ? Math.max(0, threat.timer).toFixed(1) + 'с' : '!'}`, x + w / 2, y - 5);
            }
        }
        ctx.restore();
    }
}
