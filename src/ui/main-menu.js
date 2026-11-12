/** Стартовый экран, краткое обучение и возврат к забегу без нового игрового цикла. */
import { CONFIG } from '../data/config.js';
import { MODULES_CATALOG } from '../data/modules.js';
import { META_PROJECTS_CATALOG } from '../data/projects.js';

export class MainMenuUI {
    setApplicationShell(mode) {
        document.body.dataset.shell = mode;
        document.getElementById('main-menu').classList.toggle('hidden', mode !== 'menu');
        this.resizeCanvas();
    }

    hideGameModals() {
        for (const id of ['modal-pause', 'modal-guide', 'modal-pod', 'modal-station', 'modal-death', 'modal-hub', 'modal-expedition']) {
            document.getElementById(id).classList.add('hidden');
        }
    }

    openMainMenu(tab = 'play') {
        this.hideGameModals();
        this.state = 'MENU';
        this.keys = { left: false, right: false, down: false };
        this.setApplicationShell('menu');
        this.showMainMenuTab(tab);
        this.updateMenuAudio();
        document.getElementById('menu-bank').textContent = this.meta.state.bankOre;
        document.getElementById('menu-slots').textContent = `${this.meta.state.baseModuleSlots}/${CONFIG.MAX_MODULE_SLOTS}`;
        document.getElementById('menu-blueprints').textContent = `${this.meta.state.unlockedModules.length}/${Object.keys(MODULES_CATALOG).length}`;
        document.getElementById('menu-projects').textContent = `${this.meta.state.unlockedProjects.length}/${Object.keys(META_PROJECTS_CATALOG).length}`;
        document.getElementById('btn-menu-play').textContent = this.hasActiveRun ? 'Продолжить забег' : 'Начать экспедицию';
        document.getElementById('btn-menu-new-run').classList.toggle('hidden', !this.hasActiveRun);
        document.getElementById('menu-run-status').textContent = this.hasActiveRun
            ? `Забег на паузе · слой ${this.currentLayerNumber} · ${this.drill.ore} руды в трюме`
            : 'Старт с Земной Коры · боковые лазеры уже установлены';
    }

    showMainMenuTab(tab) {
        this.mainMenuTab = tab === 'learn' ? 'learn' : 'play';
        for (const id of ['play', 'learn']) {
            const active = this.mainMenuTab === id;
            document.getElementById(`menu-panel-${id}`).classList.toggle('hidden', !active);
            document.getElementById(`menu-tab-${id}`).setAttribute('aria-selected', String(active));
        }
        if (this.mainMenuTab === 'learn') this.renderLearningContent(document.getElementById('menu-learning-content'));
    }

    updateMenuAudio() {
        const button = document.getElementById('btn-menu-audio');
        button.textContent = this.sound.enabled ? 'Звук: вкл' : 'Звук: выкл';
        button.setAttribute('aria-pressed', String(this.sound.enabled));
        for (const id of ['btn-menu-music', 'btn-pause-music']) {
            const musicButton = document.getElementById(id);
            musicButton.textContent = this.sound.music.enabled ? 'Музыка: вкл' : 'Музыка: выкл';
            musicButton.setAttribute('aria-pressed', String(this.sound.music.enabled));
        }
    }

    resumeRun() {
        if (!this.hasActiveRun || !this.drill || this.drill.hull <= 0 || this.drill.fuel <= 0) return false;
        this.hideGameModals();
        this.setApplicationShell('game');
        this.state = 'PLAYING';
        this.keys = { left: false, right: false, down: false };
        this.updateHUD();
        return true;
    }

    renderLearningContent(container) {
        container.replaceChildren();
        const cards = [
            ['01', 'Цель экспедиции', 'Бури вниз, добывай руду и добирайся до станции внизу слоя. Пройди шесть ярусов до Ядра; дальше начинается бесконечная Бездна.'],
            ['02', 'Управление и опасности', 'Стрелки или A / D / S — движение и бурение. Пробел / Shift или ⚡ — форсаж. Жёлтая полоса предупреждает, красная бьёт. При 95% нагрева корпус получает урон. P / Esc — пауза.'],
            ['03', 'Сила в текущем забеге', 'Капсулы и станции дают устройства до 3-го уровня. Модификаторы из тайников подбираются автоматически и не занимают слоты. На станции улучшай привод, бак и броню шасси.'],
            ['04', 'Как сохранить добычу', 'На станции отправляй 50% или всю руду в банк. После гибели руда в трюме, снаряжение и улучшения забега теряются; банк сохраняется. Реликвии тоже пополняют банк.'],
            ['05', 'Постоянная прогрессия', 'В ангаре трать банк на стартовые слоты, чертежи устройств и проекты недр. Чертёж добавляет устройство в пул находок и магазина; проект открывает новые постройки или события.'],
            ['06', 'Следующая попытка', 'Спуск → добыча → станция → перевод в банк → покупки в ангаре → новый забег. За прорыв шестого слоя — ещё 150 руды в банк. Перезагрузка страницы завершает текущий забег, постоянные покупки и банк остаются.']
        ];
        for (const [number, title, description] of cards) {
            const card = document.createElement('article');
            card.className = 'learning-card';
            const index = document.createElement('span');
            index.className = 'learning-number'; index.textContent = number;
            const heading = document.createElement('h3'); heading.textContent = title;
            const text = document.createElement('p'); text.textContent = description;
            card.append(index, heading, text); container.appendChild(card);
        }
    }
}
