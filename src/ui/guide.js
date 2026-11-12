/**
 * Внутриигровой справочник и его вкладки.
 * Методы подключаются к GameController; this — общий экземпляр игры (см. docs/architecture.md).
 */
import { MODULES_CATALOG } from '../data/modules.js';
import { RARITY_TIERS } from '../data/rarities.js';
import { SYNERGIES_CATALOG } from '../data/synergies.js';
import { MODIFIERS_CATALOG } from '../data/modifiers.js';

export class GuideUI {
    toggleGuide() {
        if (this.state === 'MENU') { this.showMainMenuTab('learn'); return; }
        if (this.state === 'STRUCTURE') return;
        if (this.state === 'GUIDE') {
            this.closeGuide();
        } else if (this.state !== 'FATAL_SEQUENCE') {
            this.openGuide(this.activeGuideTab || 'mech');
        }
    }

    openGuide(tab = 'mech') {
        if (this.state === 'MENU') this.setApplicationShell('overlay');
        if (this.state !== 'GUIDE') {
            this.prevStateBeforeGuide = this.state;
        }
        this.state = 'GUIDE';
        this.keys = { left: false, right: false, down: false };
        document.getElementById('modal-guide').classList.remove('hidden');
        this.renderGuideUI(tab);
    }

    closeGuide() {
        document.getElementById('modal-guide').classList.add('hidden');
        if (this.state === 'GUIDE') {
            this.state = this.prevStateBeforeGuide || 'PLAYING';
            if (this.state === 'MENU') this.openMainMenu('learn');
        }
    }

    renderGuideUI(tab = 'mech') {
        this.activeGuideTab = tab;
        const tabs = {
            learn: document.getElementById('tab-btn-learn'),
            mech: document.getElementById('tab-btn-mech'),
            blocks: document.getElementById('tab-btn-blocks'),
            modules: document.getElementById('tab-btn-modules')
        };
        Object.keys(tabs).forEach((k) => {
            if (!tabs[k]) return;
            tabs[k].className = (k === tab)
                ? 'btn-emerald py-1.5 px-2 rounded text-[10px] sm:text-xs font-extrabold uppercase'
                : 'btn-game py-1.5 px-2 rounded text-[10px] sm:text-xs font-extrabold uppercase text-slate-200';
        });

        const container = document.getElementById('guide-tab-content');
        container.innerHTML = '';

        if (tab === 'learn') {
            this.renderLearningContent(container);
        } else if (tab === 'mech') {
            const mechCards = [
                {
                    icon: this.art.icons.heat, title: 'Комплексы и защитные системы', badge: 'БЕЗ МЕНЮ',
                    badgeColor: 'text-rose-300 border-rose-400/50 bg-rose-950/60',
                    desc: 'Тайники ◆ собираются автоматически при разрушении. Лазеры, разряды, горны и обвалы сначала отмечают опасную полосу жёлтым, затем бьют по красной зоне. Окружающую породу можно разрушить, но сама защитная установка продолжает работать. Выбирайте маршрут и момент прохода движением. Урон растёт с глубиной; суммарная пассивная защита поглощает максимум 65% урона, кроме полного блока щитом.'
                },
                {
                    icon: this.art.icons.heat,
                    title: 'Форсаж и ритм проходки', badge: 'ПРОБЕЛ / SHIFT',
                    badgeColor: 'text-cyan-300 border-cyan-400/50 bg-cyan-950/60',
                    desc: 'Форсаж тратит 6 топлива, добавляет 18 нагрева и пробивает участок 3×2 перед коронкой (120 урона клетке). На 2 секунды бурение ускоряется в 2,4 раза, восстановление — 8 секунд с момента запуска. В этот момент перегрев не замедляет коронку. На телефоне нажмите ⚡. Ручная проходка копит до 5 ступеней ритма: +8% мощности за ступень. Через 2,5 секунды без ручного разрушения ритм сбрасывается. В забеге сразу установлены бесплатные боковые лазеры.'
                },
                {
                    icon: this.art.icons.fuel,
                    title: '1. Посекундный Расход Топлива (Таймер Выживания)',
                    badge: 'ГЛАВНЫЙ ЛИМИТ',
                    badgeColor: 'text-amber-300 border-amber-400/50 bg-amber-950/60',
                    desc: 'Реактор бура потребляет топливо КАЖДУЮ СЕКУНДУ нахождения на уровне (от 2.38 до 3.68 ед./сек, с плавным ростом и пределом в Бездне). Бурение и движение НЕ тратят лишнего топлива — важно лишь время! Ищите в породе Нефть (+20), Каменный Уголь (+7) и зеленые Энергоблоки (+30), чтобы не заглохнуть.'
                },
                {
                    icon: this.art.icons.heat,
                    title: '2. Система Перегрева и Охлаждения',
                    badge: 'ТЕРМОКОНТРОЛЬ',
                    badgeColor: 'text-orange-300 border-orange-400/50 bg-orange-950/60',
                    desc: 'Твердые породы и жар глубоких слоев нагревают бур (0–100%). Если нагрев достигнет 72%, скорость бурения упадет на 45%, а посекундный расход топлива вырастет в 1.45 раза! При 95% и выше корпус получает тепловой урон каждые 1.25с. Отпустите бурение для охлаждения, добудьте Энергоблок/Виталиум или используйте «Крио-Импульс Буран» для сброса жара.'
                },
                {
                    icon: this.art.textures.THERMAL_POCKET,
                    title: '3. Динамические Катаклизмы и Глубинное Давление',
                    badge: 'УГРОЗЫ ПЛАНЕТЫ',
                    badgeColor: 'text-rose-300 border-rose-400/50 bg-rose-950/60',
                    desc: 'Планета регулярно устраивает 3 вида катаклизмов с таймером предупреждения (1.8–2.3с): Подземное Извержение Лавы (уйдите с оранжевых клеток), Горизонтальный Огненный Прорыв (пробуритесь на 1 ряд ниже) и Сейсмический Камнепад сверху (отойдите вбок из-под стрелок). Чем ближе вы к выходу со слоя, тем выше плотность ловушек!'
                },
                {
                    icon: this.art.textures.STATION_GATE,
                    title: '4. Подземные Станции, Развилки Слоев и Глобальный Банк',
                    badge: 'МАРШРУТ И ЭКОНОМИКА',
                    badgeColor: 'text-cyan-300 border-cyan-400/50 bg-cyan-950/60',
                    desc: 'Забег всегда начинается со Слоя 1 (Земная Кора). На каждой Подземной Станции вы не только чинитесь и прокачиваете модули, но и выбираете АЛЬТЕРНАТИВНЫЙ МАРШРУТ на следующий ярус (например: Споровые Токси-Гроты 2А или Мерзлотные Крио-Шахты 2Б; Абиссальный Разлом 4А или Кладбище Древних Машин 4Б), подстраиваясь под собранные модули!'
                }
            ];

            mechCards.forEach((m) => {
                const row = document.createElement('div');
                row.className = 'bg-[#11192b] p-2.5 rounded-lg border border-slate-700/80 flex items-start gap-2.5';
                row.appendChild(this.art.createIconCanvasElement(m.icon, 32, 'w-8 h-8 mt-0.5'));
                const txt = document.createElement('div');
                txt.className = 'flex-1 min-w-0';
                txt.innerHTML = `
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                        <span class="font-extrabold text-white text-xs">${m.title}</span>
                        <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${m.badgeColor}">${m.badge}</span>
                    </div>
                    <p class="text-[11px] text-slate-300 mt-1 leading-relaxed">${m.desc}</p>
                `;
                row.appendChild(txt);
                container.appendChild(row);
            });
        } else if (tab === 'blocks') {
            const blocksCatalog = [
                { tex: 'OIL_VEIN', name: 'Нефтяная Жила', tag: '+20 Топлива', tagCol: 'text-amber-300', desc: 'Главный источник топлива в недрах. Всегда корректируйте маршрут ради нефтеносных жил.' },
                { tex: 'ENERGY_BLOCK', name: 'Энергоблок', tag: '+30 Топлива и -18% Жара', tagCol: 'text-emerald-300', desc: 'Высокотехнологичная батарея: мощно заправляет бак и мгновенно охлаждает реактор бура.' },
                { tex: 'ORE_VITALIUM', name: 'Виталиум (Живая Руда)', tag: '+8 Жизней и +18 Руды', tagCol: 'text-rose-300', desc: 'Редкий целебный био-кристалл. Восстанавливает обшивку корпуса, охлаждает бур и дает руду. Часто встречается в Кристальных Жеодах.' },
                { tex: 'CHRONO_SPHERE', name: 'Хроно-Сфера «Эфир»', tag: '7с 0 расхода топлива + Ускорение', tagCol: 'text-sky-300', desc: 'Положительный артефакт (открывается в Ангаре): останавливает расход топлива на 7 секунд, ускоряет бурение на +40% и удваивает перезарядку оружия!' },
                { tex: 'OMEGA_MEDKIT', name: 'Нано-Капсула «Абсолют»', tag: '+18 Жизней, +20 Топл., 0% Жара', tagCol: 'text-emerald-300', desc: 'Положительный предмет (открывается в Ангаре): мощно чинит обшивку, заправляет бак и полностью охлаждает реактор.' },
                { tex: 'STAR_RELIC', name: 'Звёздная Реликвия Предтеч', tag: '+90 Руды и +35 сразу в Банк!', tagCol: 'text-yellow-300', desc: 'Древнее сокровище (встречается в Сокровищнице Мидаса и Лаборатории «Омега»): дает +90 Руды в трюм, мгновенно отправляет +35 Руды в Глобальный Банк и перезаряжает все модули!' },
                { tex: 'TECH_POD', name: 'Сундук-Капсула Модулей', tag: 'Одна награда на выбор', tagCol: 'text-cyan-300', desc: 'Установите устройство, улучшите имеющееся, выберите модификатор без расхода слота или разберите капсулу на ресурсы. Все варианты взаимоисключающие.' },
                { tex: 'SUPPLY_CRATE', name: 'Ящик Снабжения Бункера', tag: '+16 Топл., +3 HP, +28 Руды', tagCol: 'text-yellow-300', desc: 'Встречается в Заброшенных Бункерах Шахтеров, Древних Сводах и на Инженерных Мостах над разломами.' },
                { tex: 'ORE_COAL', name: 'Каменный Уголь', tag: '+9 Руды и +7 Топлива', tagCol: 'text-orange-300', desc: 'Базовая жила Земной Коры — одновременно пополняет трюм рудой и немного подзаряжает топливный бак.' },
                { tex: 'ORE_IRON', name: 'Железная Руда', tag: '+15 Руды (Слои 1-2)', tagCol: 'text-orange-400', desc: 'Распространенная промышленная руда верхних слоев планеты.' },
                { tex: 'ORE_COBALT', name: 'Кобальтовая Жила', tag: '+22 Руды (Слои 2-3)', tagCol: 'text-emerald-300', desc: 'Плотная изумрудно-синяя руда Споровых Токси-Гротов и Кристальных Пещер.' },
                { tex: 'ORE_QUARTZ', name: 'Голубой Кварц', tag: '+28 Руды (Слой 3)', tagCol: 'text-cyan-300', desc: 'Твердый кристалл третьего слоя. Отличная цель для ракет и боковых лазеров.' },
                { tex: 'ORE_AMETHYST', name: 'Друза Аметиста', tag: '+42 Руды (Слои 3-4)', tagCol: 'text-purple-300', desc: 'Богатый самоцвет Кристальных Пещер и Абиссального Разлома.' },
                { tex: 'ORE_TITANITE', name: 'Магматический Титанит', tag: '+62 Руды (Слои 4-5)', tagCol: 'text-pink-300', desc: 'Сверхпрочный редкий металл глубоких разломов и мантии.' },
                { tex: 'ORE_CORE', name: 'Ядро-Кристалл', tag: '+90 Руды (Слои 5-6)', tagCol: 'text-rose-400', desc: 'Редкий минерал Магматической Мантии и сокровищниц Древних Руин.' },
                { tex: 'ORE_AETHERIUM', name: 'Реликтовый Эфириум', tag: '+135 Руды (Слой 6 — Ядро)', tagCol: 'text-yellow-300', desc: 'Самый ценный минерал во Вселенной, залегающий только в Сингулярном Ядре на 6-м слое!' },
                { tex: 'GAS_POCKET', name: 'Газ под давлением', tag: 'ОПАСНОСТЬ: Взрыв -44 HP', tagCol: 'text-lime-300', desc: 'Взрывается при бурении ИЛИ через 2.9 сек, если стоять рядом! С модулем «Фильтр-Реактор Газа» или при подрыве оружием дает +Топливо.' },
                { tex: 'ACID_POCKET', name: 'Кислотный Карман', tag: 'ОПАСНОСТЬ: -34 HP и -14 Топлива', tagCol: 'text-green-400', desc: 'Встречается в Токси-Гротах и Разломе. При контактном бурении разъедает корпус и топлиропровод (-14 Топлива). Уничтожайте оружием или «Фильтром Газа»!' },
                { tex: 'UNSTABLE_ROCK', name: 'Падающий Валун', tag: 'ОПАСНОСТЬ: Обвал -46 HP', tagCol: 'text-slate-300', desc: 'Если выкопать блок под валуном, он начнет дрожать и рухнет вниз. Не стойте под дрожащим камнем!' },
                { tex: 'THERMAL_POCKET', name: 'Карман Лавы', tag: 'ОПАСНОСТЬ: -42 HP и +38% Жара', tagCol: 'text-red-400', desc: 'Обжигает корпус и перегревает бур. Замораживается модулем «Крио-Импульс Буран» в ценный Обсидиан (+28 Руды).' },
                { tex: 'CRYO_TRAP', name: 'Крио-Осколок Холода', tag: 'Слой 2Б: -28 HP и Обледенение', tagCol: 'text-sky-300', desc: 'Встречается в Мерзлотных Крио-Шахтах (2Б). При контактном бурении замораживает привод (-38% скорости на 4с). При подрыве оружием дает +24 Руды!' },
                { tex: 'ELECTRO_NODE', name: 'Электро-Конденсатор', tag: 'Слой 3Б: -38 HP или Заряд оружия', tagCol: 'text-yellow-300', desc: 'Встречается в Магнитных Разломах (3Б). При контактном бурении бьет током и сбрасывает таймеры модулей, но при взрыве оружием дает +20 Топлива и заряжает все оружие!' },
                { tex: 'ARC_MINE', name: 'Реакторная Мина Древних', tag: 'Слой 4Б/5Б: Взрыв -52 HP или +40 Руды', tagCol: 'text-orange-400', desc: 'Встречается на Кладбище Машин (4Б). Детонирует при бурении вплотную, но при расстреле оружием издалека оставляет +40 Руды!' },
                { tex: 'VOID_POCKET', name: 'Аномалия Пустоты', tag: 'ОПАСНОСТЬ: -54 HP и +26% Жара', tagCol: 'text-purple-400', desc: 'Встречается в Сингулярном Ядре (Слой 6). При контактном бурении детонирует грави-взрывом. Расстреливайте оружием издалека!' }
            ];

            const gridEl = document.createElement('div');
            gridEl.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2';
            blocksCatalog.forEach((b) => {
                const card = document.createElement('div');
                card.className = 'bg-[#11192b] p-2 rounded border border-slate-700/80 flex items-start gap-2';
                card.appendChild(this.art.createIconCanvasElement(this.art.textures[b.tex], 28, 'w-7 h-7 mt-0.5'));
                const info = document.createElement('div');
                info.className = 'min-w-0 flex-1';
                info.innerHTML = `
                    <div class="flex items-center justify-between gap-1 flex-wrap">
                        <span class="font-extrabold text-white text-[11px]">${b.name}</span>
                        <span class="text-[9px] font-extrabold ${b.tagCol}">${b.tag}</span>
                    </div>
                    <p class="text-[10px] text-slate-300 mt-0.5 leading-snug">${b.desc}</p>
                `;
                card.appendChild(info);
                gridEl.appendChild(card);
            });
            container.appendChild(gridEl);
        } else if (tab === 'modules') {
            // Сначала блок Комбо-Синергий
            const synTitle = document.createElement('div');
            synTitle.className = 'text-[11px] font-extrabold uppercase text-amber-300 mb-1';
            synTitle.textContent = 'Комбо-Синергии Модулей (активируются автоматически при совместной установке):';
            container.appendChild(synTitle);

            const synGrid = document.createElement('div');
            synGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3';
            SYNERGIES_CATALOG.forEach((syn) => {
                const isActiveNow = this.drill && syn.check(this.drill);
                const sCard = document.createElement('div');
                sCard.className = `p-2 rounded border ${isActiveNow ? 'bg-amber-950/60 border-amber-400' : 'bg-[#11192b] border-slate-700/80'}`;
                sCard.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-extrabold text-yellow-300">${syn.name}</span>
                        <span class="text-[8px] font-extrabold px-1.5 py-0.5 rounded ${isActiveNow ? 'bg-emerald-950 text-emerald-300 border border-emerald-400/50' : 'bg-slate-800 text-slate-400'}">
                            ${isActiveNow ? 'АКТИВНА СЕЙЧАС' : 'КОМБО'}
                        </span>
                    </div>
                    <div class="text-[10px] text-slate-200 mt-0.5 leading-snug">${syn.desc}</div>
                `;
                synGrid.appendChild(sCard);
            });
            container.appendChild(synGrid);

            const findings = document.createElement('div');
            findings.className = 'p-3 mb-3 rounded border border-cyan-700 text-xs text-slate-300';
            const heading = document.createElement('h3');
            heading.className = 'font-bold text-cyan-300 mb-2';
            heading.textContent = 'Модификаторы экспедиции — без расхода слотов';
            findings.appendChild(heading);
            for (const spec of Object.values(MODIFIERS_CATALOG)) {
                const entry = document.createElement('p');
                entry.className = 'mb-2';
                entry.textContent = `${spec.name}: ${spec.desc}`;
                findings.appendChild(entry);
            }
            container.appendChild(findings);

            // Полный каталог устройств по редкости.
            const modTitle = document.createElement('div');
            modTitle.className = 'text-[11px] font-extrabold uppercase text-cyan-300 mb-1 pt-1 border-t border-slate-800';
            modTitle.textContent = 'Полный каталог модулей (Обычные -> Редкие -> Эпические -> Легендарные):';
            container.appendChild(modTitle);

            const modGrid = document.createElement('div');
            modGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-1.5';
            Object.values(MODULES_CATALOG).forEach((mod) => {
                const rInfo = RARITY_TIERS[mod.rarity || 'COMMON'];
                const mCard = document.createElement('div');
                mCard.className = 'bg-[#11192b] p-2 rounded border border-slate-700/80 flex items-start gap-2';
                mCard.appendChild(this.art.createIconCanvasElement(this.art.moduleIcons[mod.id], 26, 'w-6 h-6 mt-0.5'));
                const mInfo = document.createElement('div');
                mInfo.className = 'min-w-0 flex-1';
                mInfo.innerHTML = `
                    <div class="flex items-center justify-between gap-1 flex-wrap">
                        <span class="font-extrabold ${rInfo.textColor} text-[11px] truncate">${mod.name}</span>
                        <span class="text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${rInfo.badgeBg}">${rInfo.name}</span>
                    </div>
                    <div class="text-[9px] text-slate-400 font-bold mt-0.5">Покупка: ${mod.buyCost} Руды | Апгрейды Ур.2/3: ${mod.upgradeCosts[0]}/${mod.upgradeCosts[1]}</div>
                    <p class="text-[10px] text-slate-200 mt-0.5 leading-snug"><strong>Ур.1:</strong> ${mod.descByLvl[0]}</p>
                    <p class="text-[9px] text-cyan-300/90 mt-0.5 leading-snug"><strong>Ур.3:</strong> ${mod.descByLvl[2]}</p>
                `;
                mCard.appendChild(mInfo);
                modGrid.appendChild(mCard);
            });
            container.appendChild(modGrid);
        }
    }
}
