/**
 * Обратная связь об уроне, гибель и отчёт о забеге.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { CONFIG } from '../data/config.js';

export class DamageSystem {
    triggerDamageFeedback(gridX, gridY, dmgAmount, titleText, subtitleText, causeKey) {
        if (this.drill.hull <= 0) {
            this.drill.hull = 0;
            this.startFatalSequence(causeKey, gridX, gridY);
            return;
        }
        // Ответный импульс Демпферной Брони «Бастион» (срабатывает даже при блоке щитом в синергии!)
        if (this.drill.hasModule('BLAST_ARMOR') && this.drill.bastionWaveCooldown <= 0) {
            this.drill.bastionWaveCooldown = 0.6;
            this.triggerBastionCounterWave();
        }

        if (dmgAmount === 0) {
            // Щит заблокировал удар!
            this.sound.playLaserPulse();
            this.shockwaveRings.push({
                x: (this.drill.visualX + 0.5) * CONFIG.TILE_SIZE,
                y: (this.drill.visualY + 0.5) * CONFIG.TILE_SIZE,
                radius: 8,
                maxRadius: CONFIG.TILE_SIZE * 2.1,
                color: '99, 102, 241',
                life: 0.45,
                maxLife: 0.45
            });
            this.spawnFloatingText(this.drill.visualX, this.drill.visualY - 0.5, 'ЩИТ ОТРАЗИЛ УДАР!', '#818cf8', true);
            if (this.drill.getModuleLevel('TITAN_SHIELD') >= 3) {
                this.fireRocketSalvo(2);
            }
            return;
        }

        this.screenShake = 0.35;
        this.hitStopTimer = 0.12;
        this.damageFlashTimer = 0.50;

        this.shockwaveRings.push({
            x: (gridX + 0.5) * CONFIG.TILE_SIZE,
            y: (gridY + 0.5) * CONFIG.TILE_SIZE,
            radius: 8,
            maxRadius: CONFIG.TILE_SIZE * 2.2,
            color: '239, 68, 68',
            life: 0.50,
            maxLife: 0.50
        });

        const banner = document.getElementById('damage-alert-banner');
        document.getElementById('damage-alert-title').textContent = `УРОН -${dmgAmount} ЖИЗНЕЙ: ${titleText}`;
        document.getElementById('damage-alert-subtitle').textContent = subtitleText;
        banner.classList.remove('hidden');

        if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(() => banner.classList.add('hidden'), 2500);

        if (this.drill.hull <= 0) {
            this.drill.hull = 0;
            this.startFatalSequence(causeKey, gridX, gridY);
        }
    }

    startFatalSequence(causeKey, gridX, gridY) {
        this.hasActiveRun = false;
        this.state = 'FATAL_SEQUENCE';
        this.fatalSequenceTimer = 1.4;
        this.keys = { left: false, right: false, down: false };
        this.sound.playHazardExplosion();

        const causes = {
            overheat: {
                canvasLabel: 'КОРПУС ПЕРЕГРЕТ!', title: 'Разрушение от перегрева',
                desc: 'При нагреве от 95% корпус получает периодический тепловой урон.',
                tip: 'Снижайте нагрев между плотными пластами и используйте охлаждение.', iconSource: this.art.icons.heat
            },
            fuel: {
                canvasLabel: 'КОНЧИЛОСЬ ТОПЛИВО!',
                title: 'Топливный бак пуст',
                desc: 'Бур остановился в шахте, так как топливо дошло до нуля.',
                tip: 'Совет: Бурите блоки Нефти, Угля и зеленые Энергоблоки по пути вниз!',
                iconSource: this.art.icons.fuel
            },
            gas: {
                canvasLabel: 'ВЗРЫВ ГАЗА: БУР РАЗРУШЕН!',
                title: 'Взрыв Зеленого Газа',
                desc: 'Искра бура подожгла газовый карман и разрушила обшивку.',
                tip: 'Совет: Расстреливайте газ ракетами/молниями ИЛИ берите «Фильтр-Реактор Газа»!',
                iconSource: this.art.textures.GAS_POCKET
            },
            rock: {
                canvasLabel: 'ОБВАЛ: РАЗДАВЛЕН ВАЛУНОМ!',
                title: 'Обрушение тяжелого валуна',
                desc: 'Подкопанный сверху камень упал на крышу буровой машины.',
                tip: 'Совет: Когда валун над вами дрожит — сразу смещайтесь влево или вправо!',
                iconSource: this.art.textures.UNSTABLE_ROCK
            },
            lava: {
                canvasLabel: 'РАСПЛАВЛЕН В ЛАВЕ!',
                title: 'Критический ожог Лавой',
                desc: 'Машина пробурила раскаленный лавовый карман при низком запасе прочности.',
                tip: 'Совет: Модуль «Крио-Импульс Буран» замораживает опасную лаву в ценный Обсидиан!',
                iconSource: this.art.textures.THERMAL_POCKET
            },
            eruption: {
                canvasLabel: 'СОЖЖЕН ИЗВЕРЖЕНИЕМ!',
                title: 'Подземное Извержение Магмы',
                desc: 'Бур остался на раскаленной тектонической трещине в момент взрыва.',
                tip: 'Совет: Когда клетки вокруг мигают оранжевым таймером — немедленно уходите в сторону!',
                iconSource: this.art.textures.THERMAL_POCKET
            },
            jet: {
                canvasLabel: 'СЖЁГ ОГНЕННЫЙ ПРОРЫВ!',
                title: 'Пирокластический Огненный Поток',
                desc: 'Горизонтальный выброс раскаленной плазмы прошил шахту на уровне бура.',
                tip: 'Совет: При тревоге «Огненный Прорыв» быстро бурите глубже вниз, уходя из красного ряда!',
                iconSource: this.art.icons.heat
            },
            collapse: {
                canvasLabel: 'РАЗДАВЛЕН КАМНЕПАДОМ!',
                title: 'Сейсмический Камнепад Сверху',
                desc: 'Обрушившийся сверху тектонический обломок пробил корпус бура.',
                tip: 'Совет: При тревоге «Камнепад» смещайтесь влево или вправо из-под красных стрелок!',
                iconSource: this.art.textures.UNSTABLE_ROCK
            }
        };

        this.deathInfo = { causeKey, gridX, gridY, ...(causes[causeKey] || causes.fuel) };
        this.spawnParticles(gridX, gridY, '#ef4444', 28, 170);
        this.spawnParticles(gridX, gridY, '#fbbf24', 20, 140);
        this.updateHUD();
    }

    openDeathModal() {
        this.state = 'DEAD';
        document.getElementById('damage-alert-banner').classList.add('hidden');
        document.getElementById('tectonic-warning-banner').classList.add('hidden');
        document.getElementById('overheat-banner').classList.add('hidden');
        document.getElementById('station-proximity-banner').classList.add('hidden');

        document.getElementById('modal-death').classList.remove('hidden');
        document.getElementById('death-depth-badge').textContent = `Слой ${this.currentLayerNumber}`;

        if (this.deathInfo) {
            this.art.drawToCanvas('death-cause-canvas', this.deathInfo.iconSource);
            document.getElementById('death-reason-title').textContent = this.deathInfo.title;
            document.getElementById('death-reason-desc').textContent = this.deathInfo.desc;
            document.getElementById('death-reason-tip').textContent = this.deathInfo.tip;
        }

        const dh = this.drill.damageHistory;
        document.getElementById('dmg-stat-gas').textContent = `-${dh.gas} HP`;
        document.getElementById('dmg-stat-rock').textContent = `-${dh.rock} HP`;
        document.getElementById('dmg-stat-lava').textContent = `-${dh.lava} HP`;
        document.getElementById('dmg-stat-tectonic').textContent = `-${dh.tectonic} HP`;

        document.getElementById('death-lost-cargo').textContent = `${this.drill.ore} Руды`;
        document.getElementById('death-safe-bank').textContent = `${this.meta.state.bankOre} Руды`;
    }
}
