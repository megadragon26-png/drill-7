/**
 * Клавиатура, сенсорное управление, кнопки и пауза.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { CONFIG } from '../data/config.js';

export class InputBindings {
    bindEvents() {
        // Запуск AudioContext возможен только после жеста пользователя.
        const unlockAudio = () => {
            this.sound.init();
            this.sound.updateMusic(this);
        };
        window.addEventListener('pointerdown', unlockAudio, { capture: true });
        window.addEventListener('keydown', unlockAudio, { capture: true });
        for (const id of ['btn-menu-music', 'btn-pause-music']) {
            document.getElementById(id).addEventListener('click', () => {
                this.sound.music.enabled = !this.sound.music.enabled;
                this.sound.updateMusic(this);
                this.updateMenuAudio();
            });
        }
        document.getElementById('music-volume').addEventListener('input', (event) => {
            this.sound.music.volume = Number(event.target.value) / 100;
            this.sound.updateMusic(this);
        });
        document.getElementById('btn-boost').addEventListener('click', () => this.triggerDriveBoost());
        document.getElementById('touch-boost').addEventListener('click', () => this.triggerDriveBoost());
        document.getElementById('btn-mobile-tools').addEventListener('click', () => this.toggleMobileTools());
        document.getElementById('game-header').addEventListener('click', (event) => {
            if (this.mobileToolsOpen && event.target.closest('button')?.id !== 'btn-mobile-tools') this.toggleMobileTools();
        });
        window.addEventListener('blur', () => { this.keys = { left: false, right: false, down: false }; });
        document.addEventListener('visibilitychange', () => {
            this.sound.updateMusic(this);
            if (!document.hidden) return;
            this.keys = { left: false, right: false, down: false };
            if (this.state === 'PLAYING') this.togglePause();
        });
        document.getElementById('btn-modifier-inventory').addEventListener('click', () => this.openModifierInventory());
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyH' || e.code === 'F1') {
                e.preventDefault();
                this.toggleGuide();
                return;
            }
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.state === 'GUIDE') {
                    e.preventDefault();
                    this.closeGuide();
                    return;
                }
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    e.preventDefault();
                    this.togglePause();
                    return;
                }
            }
            if (this.state !== 'PLAYING') return;
            if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                e.preventDefault();
                if (!e.repeat) this.triggerDriveBoost();
                return;
            }
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
        });

        const bindTouch = (id, keyName) => {
            const el = document.getElementById(id);
            if (!el) return;
            const start = (ev) => {
                ev.preventDefault();
                if (this.state !== 'PLAYING') return;
                this.keys[keyName] = true;
                el.setPointerCapture(ev.pointerId);
            };
            const end = (ev) => { ev.preventDefault(); this.keys[keyName] = false; };
            el.addEventListener('pointerdown', start);
            el.addEventListener('pointerup', end);
            el.addEventListener('pointercancel', end);
            el.addEventListener('lostpointercapture', end);
        };
        bindTouch('touch-left', 'left');
        bindTouch('touch-right', 'right');
        bindTouch('touch-down', 'down');

        // Удобное управление касанием прямо по игровому полю (удержание пальца слева/справа/снизу)
        const handleCanvasTouch = (ev) => {
            if (this.state !== 'PLAYING') return;
            if (!ev.touches || ev.touches.length === 0) {
                this.keys.left = false;
                this.keys.right = false;
                this.keys.down = false;
                return;
            }
            ev.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = ev.touches[0];
            const relX = (touch.clientX - rect.left) / Math.max(1, rect.width);
            const relY = (touch.clientY - rect.top) / Math.max(1, rect.height);

            this.keys.left = false;
            this.keys.right = false;
            this.keys.down = false;

            if (relY > 0.62 && relX >= 0.30 && relX <= 0.70) {
                this.keys.down = true;
            } else if (relX < 0.36) {
                this.keys.left = true;
            } else if (relX > 0.64) {
                this.keys.right = true;
            } else {
                this.keys.down = true;
            }
        };
        this.canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
        this.canvas.addEventListener('touchmove', handleCanvasTouch, { passive: false });
        this.canvas.addEventListener('touchend', () => {
            this.keys.left = false;
            this.keys.right = false;
            this.keys.down = false;
        });
        this.canvas.addEventListener('touchcancel', () => {
            this.keys.left = false;
            this.keys.right = false;
            this.keys.down = false;
        });

        for (const [id, tab] of [['st-mob-tab-mods', 'mods'], ['st-mob-tab-serv', 'serv'], ['st-mob-tab-route', 'route']]) {
            document.getElementById(id).addEventListener('click', () => this.setStationTab(tab));
        }
        for (const [id, tab] of [['hub-tab-slots', 'slots'], ['hub-mob-tab-mods', 'mods'], ['hub-mob-tab-proj', 'proj']]) {
            document.getElementById(id).addEventListener('click', () => this.setHubTab(tab));
        }
        document.getElementById('menu-tab-play').addEventListener('click', () => this.showMainMenuTab('play'));
        document.getElementById('menu-tab-learn').addEventListener('click', () => this.showMainMenuTab('learn'));
        document.getElementById('btn-menu-play').addEventListener('click', () => this.hasActiveRun ? this.resumeRun() : this.startNewRun());
        document.getElementById('btn-menu-new-run').addEventListener('click', () => this.startNewRun());
        document.getElementById('btn-menu-hub').addEventListener('click', () => this.openHubModal());
        document.getElementById('btn-menu-codex').addEventListener('click', () => this.openGuide('mech'));
        document.getElementById('btn-menu-audio').addEventListener('click', () => {
            this.sound.toggle();
            this.updateMenuAudio();
        });
        for (const id of ['btn-hub-menu', 'btn-pause-menu', 'btn-death-menu']) {
            document.getElementById(id).addEventListener('click', () => this.openMainMenu());
        }
        document.getElementById('tab-btn-learn').addEventListener('click', () => this.renderGuideUI('learn'));
        document.getElementById('btn-pause-learn').addEventListener('click', () => this.openGuide('learn'));

        // Кнопки открытия и переключения вкладок Внутриигрового Гида
        document.getElementById('btn-open-guide').addEventListener('click', () => this.toggleGuide());
        document.getElementById('btn-guide-close').addEventListener('click', () => this.closeGuide());
        document.getElementById('btn-pause-guide').addEventListener('click', () => this.openGuide('mech'));
        document.getElementById('btn-hub-guide').addEventListener('click', () => this.openGuide('blocks'));

        document.getElementById('tab-btn-mech').addEventListener('click', () => this.renderGuideUI('mech'));
        document.getElementById('tab-btn-blocks').addEventListener('click', () => this.renderGuideUI('blocks'));
        document.getElementById('tab-btn-modules').addEventListener('click', () => this.renderGuideUI('modules'));

        document.getElementById('btn-pause-toggle').addEventListener('click', () => {
            if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                this.togglePause();
            }
        });
        document.getElementById('btn-pause-resume').addEventListener('click', () => {
            if (this.state === 'PAUSED') this.togglePause();
        });
        document.getElementById('btn-pause-restart').addEventListener('click', () => {
            document.getElementById('modal-pause').classList.add('hidden');
            this.startNewRun();
        });

        document.getElementById('btn-audio-toggle').addEventListener('click', () => this.sound.toggle());

        // Экран поражения
        document.getElementById('btn-death-retry').addEventListener('click', () => {
            document.getElementById('modal-death').classList.add('hidden');
            this.startNewRun();
        });
        document.getElementById('btn-death-hangar').addEventListener('click', () => {
            document.getElementById('modal-death').classList.add('hidden');
            this.openHubModal(null);
        });

        // Станция
        document.getElementById('btn-station-refuel').addEventListener('click', () => this.stationBuyRefuel());
        document.getElementById('btn-station-repair').addEventListener('click', () => this.stationBuyRepair());
        document.getElementById('btn-upg-torque').addEventListener('click', () => this.stationUpgradeChassis('torque'));
        document.getElementById('btn-upg-tank').addEventListener('click', () => this.stationUpgradeChassis('tank'));
        document.getElementById('btn-upg-armor').addEventListener('click', () => this.stationUpgradeChassis('armor'));
        document.getElementById('btn-station-reroll').addEventListener('click', () => this.stationRerollShop());
        document.getElementById('btn-station-buy-slot').addEventListener('click', () => this.stationBuyRunSlot());
        document.getElementById('btn-evac-half').addEventListener('click', () => this.stationSendToBank(0.5));
        document.getElementById('btn-evac-all').addEventListener('click', () => this.stationSendToBank(1.0));
        document.getElementById('btn-station-descend').addEventListener('click', () => this.descendToNextLayer());

        // Ангар
        document.getElementById('btn-hub-upgrade-slot').addEventListener('click', () => this.hubUpgradeBaseSlots());
        document.getElementById('btn-start-run').addEventListener('click', () => {
            document.getElementById('modal-hub').classList.add('hidden');
            if (this.hasActiveRun) this.resumeRun(); else this.startNewRun();
        });
    }

    toggleMobileTools() {
        this.mobileToolsOpen = !this.mobileToolsOpen;
        document.getElementById('game-header').classList.toggle('mobile-tools-open', this.mobileToolsOpen);
        document.getElementById('btn-mobile-tools').setAttribute('aria-expanded', String(this.mobileToolsOpen));
        this.resizeCanvas();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.keys = { left: false, right: false, down: false };
            const depthRatio = this.drill.gridY / Math.max(1, CONFIG.LAYER_ROWS);
            document.getElementById('pause-stat-layer').textContent = `Слой ${this.currentLayerNumber}`;
            document.getElementById('pause-stat-ore').textContent = `${this.drill.ore} Руды`;
            const dangerEl = document.getElementById('pause-stat-danger');
            if (depthRatio >= 0.72) {
                dangerEl.textContent = 'КРИТИЧЕСКАЯ';
                dangerEl.className = 'text-xs font-extrabold text-rose-400 mt-0.5';
            } else if (depthRatio >= 0.40) {
                dangerEl.textContent = 'Повышенная';
                dangerEl.className = 'text-xs font-extrabold text-amber-300 mt-0.5';
            } else {
                dangerEl.textContent = 'Умеренная';
                dangerEl.className = 'text-xs font-extrabold text-emerald-300 mt-0.5';
            }
            document.getElementById('modal-pause').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('modal-pause').classList.add('hidden');
        }
    }
}
