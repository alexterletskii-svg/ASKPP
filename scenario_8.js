(function initScenarioEngine() {
    const style = document.createElement('style');
    style.innerHTML = `
        .tutorial-target {
            position: relative !important;
            box-shadow: 0 0 0 3px rgba(242, 101, 34, 1), 0 0 15px rgba(242, 101, 34, 0.8) !important;
            outline: none !important;
            border-radius: 2px;
            z-index: 100001 !important;
        }
        #tutorial-tooltip {
            position: absolute;
            background-color: #0056a4;
            color: #ffffff;
            padding: 18px 22px;
            border-radius: 6px;
            font-family: 'Tahoma', sans-serif;
            font-size: 13px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 100002;
            width: max-content;
            max-width: 440px;
            pointer-events: none;
            line-height: 1.5;
            border: 1px solid #4a90d9;
        }
        #tutorial-tooltip::after {
            content: ''; position: absolute; border: 8px solid transparent;
        }
        #tutorial-tooltip.arrow-left::after {
            top: 50%; left: -16px; transform: translateY(-50%); border-right-color: #0056a4;
        }
        #tutorial-tooltip.arrow-right::after {
            top: 50%; right: -16px; transform: translateY(-50%); border-left-color: #0056a4;
        }
        #tutorial-tooltip.arrow-top::after {
            bottom: 100%; top: auto; left: var(--arrow-pos, 50%); transform: translateX(-50%);
            border-bottom-color: #0056a4; border-right-color: transparent; border-left-color: transparent;
        }
        #tutorial-tooltip.arrow-bottom::after {
            top: 100%; bottom: auto; left: var(--arrow-pos, 50%); transform: translateX(-50%);
            border-top-color: #0056a4; border-right-color: transparent; border-left-color: transparent;
        }
        .action-badge {
            font-weight: bold;
            font-size: 15px;
            color: #ffda44;
            letter-spacing: 0.5px;
        }
        .purpose-text {
            background-color: rgba(0, 86, 164, 0.5);
            padding: 12px;
            border-radius: 4px;
            margin-top: 10px;
            margin-bottom: 10px;
            border-left: 3px solid #ffda44;
            font-size: 12px;
            line-height: 1.4;
        }
    `;
    document.head.appendChild(style);

    const tooltip = document.createElement('div');
    tooltip.id = 'tutorial-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    // ==========================================
    // ПРОПУСК АВТОРИЗАЦИИ И ЗАГРУЗКА БАЗЫ
    // ==========================================
    document.getElementById('initial-screen').classList.add('hidden');
    if (typeof regenerateSystemData === 'function') {
        regenerateSystemData('DQS_CAL6');
    }

    // ==========================================
    // БЛОКИРОВЩИК КЛИКОВ
    // ==========================================
    let activeTarget = null;
    let currentPlacement = 'right';
    let isTransitioning = false;

    function isClickAllowed(e) {
        if (!e.isTrusted) return true;
        if (isTransitioning) return false;

        // ЗАЩИТА ОТ БАГА: правая кнопка мыши блокируется ВСЕГДА и ВЕЗДЕ,
        // независимо от activeTarget. Причина: в реальном приложении
        // правый клик по блокам классов / ярлыкам дефектов открывает
        // штатное окно "Subclass Modal", которое не знакомо нашему
        // сценарию. Если бы мы разрешали правый клик внутри activeTarget
        // (как обычный клик), пользователь мог случайно открыть это окно
        // и "застрять" — оно не входит в activeTarget, поэтому закрыть
        // его было бы нечем. Поэтому правая кнопка отсекается ещё до
        // проверки зоны, без каких-либо исключений.
        if (e.button === 2) return false;

        if (activeTarget && !activeTarget.contains(e.target)) return false;
        return true;
    }

    document.addEventListener('mousedown', function(e) {
        if (!isClickAllowed(e)) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    document.addEventListener('click', function(e) {
        if (!isClickAllowed(e)) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // ЗАЩИТА ОТ БАГА: contextmenu блокируется БЕЗУСЛОВНО, всегда,
    // без проверки activeTarget. Ни один шаг сценария не требует
    // правого клика, поэтому глушим системное контекстное меню
    // и любые обработчики приложения, привязанные к этому событию,
    // на всём протяжении обучения.
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, true);

    document.addEventListener('keydown', function(e) {
        if (activeTarget && e.key === 'Tab') {
            e.preventDefault(); e.stopPropagation();
            const input = activeTarget.querySelector('input');
            if (input) input.focus();
            else if(typeof activeTarget.focus === 'function') activeTarget.focus();
        }
    }, true);

    function updateTooltipPosition() {
        if (!activeTarget || tooltip.style.display === 'none') return;
        const rect = activeTarget.getBoundingClientRect();
        tooltip.style.setProperty('--arrow-pos', '50%');

        if (currentPlacement === 'right') {
            tooltip.style.left = (rect.right + 20) + 'px';
            tooltip.style.top = (rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2)) + 'px';
            tooltip.className = 'arrow-left';
        }
        else if (currentPlacement === 'left') {
            let leftPos = rect.left - tooltip.offsetWidth - 20;
            if (leftPos < 10) {
                currentPlacement = 'bottom';
                return updateTooltipPosition();
            }
            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = (rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2)) + 'px';
            tooltip.className = 'arrow-right';
        }
        else if (currentPlacement === 'bottom') {
            let leftPos = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
            if (leftPos < 10) {
                let shiftDiff = 10 - leftPos;
                leftPos = 10;
                tooltip.style.setProperty('--arrow-pos', `calc(50% - ${shiftDiff}px)`);
            } else if (leftPos + tooltip.offsetWidth > window.innerWidth - 10) {
                let overflow = (leftPos + tooltip.offsetWidth) - (window.innerWidth - 10);
                leftPos -= overflow;
                tooltip.style.setProperty('--arrow-pos', `calc(50% + ${overflow}px)`);
            }
            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = (rect.bottom + 15) + 'px';
            tooltip.className = 'arrow-top';
        }
        else if (currentPlacement === 'top') {
            let leftPos = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
            if (leftPos < 10) { leftPos = 10; }
            let topPos = rect.top - tooltip.offsetHeight - 15;
            if (topPos < 10) {
                currentPlacement = 'bottom';
                return updateTooltipPosition();
            }
            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = topPos + 'px';
            tooltip.className = 'arrow-bottom';
        }
        else if (currentPlacement === 'corner') {
            // Специальное положение: правый верхний угол экрана.
            // Используется, когда рядом с целью открывается выпадающее меню/список
            // непредсказуемого размера, и обычное позиционирование рискует
            // перекрыть этот список. Тултип уводится в свободную зону справа.
            let leftPos = window.innerWidth - tooltip.offsetWidth - 30;
            if (leftPos < 10) leftPos = 10;
            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = '90px';
            tooltip.className = '';
        }
    }
    window.addEventListener('resize', updateTooltipPosition);

    // ==========================================
    // ЛОГИКА ШАГОВ
    // ==========================================
    let currentStep = 0;
    let activeListener = null;

    const steps = [
    // --- 1. ВЫБОР РУЛОНА ---
    {
        delay: 500,
        targetSelector: '.panel-left .box.h-35',
        eventType: 'click',
        placement: 'right',
        text: 'Добро пожаловать в обучение!<br><br>В этом сценарии мы изучим скрытие дефектов через глобальное меню <b>подклассов</b>.<br><br>Чтобы начать — кликните по <span class="action-badge">ЛЮБОМУ</span> рулону в левой таблице 2 раза.',
        validate: (e) => !!e.target.closest('#coil-tbody tr')
    },

    // --- 2. НАЖАТИЕ НА КНОПКУ ТУЛБАРА (ПЕРВЫЙ СПОСОБ – ГРУППЫ) ---
    {
        delay: 1000,
        onEnter: () => {
            const targetBtn = document.querySelector('.tb-btn[title="Выбрать класс дефекта"]');
            if (targetBtn) targetBtn.id = 'tut-btn-class-filter';
        },
        targetSelector: '#tut-btn-class-filter',
        eventType: 'click',
        placement: 'bottom',
        text: `В интерфейсе предусмотрено <b>два способа</b> фильтрации классов дефектов:<br><br>
        <b>1.</b> Область над картой рулона (справа) — все классы объединены в группы по специфике. Удобно включать / отключать целую группу одним кликом, что ускоряет обработку информации. При этом внутри группы можно точечно отключить конкретный класс (это как раз приводит к появлению жёлтого цвета).<br><br>
        <b>2.</b> Кнопка <span class="action-badge">«Выбрать класс дефекта»</span> на тулбаре (или аналогичный пункт в меню) — открывает диалоговое окно со всеми классами списком.<br><br>
        Сейчас мы воспользуемся <b>вторым способом</b> — кликните по кнопке <img src="picture/ico/ico_10.png" style="vertical-align: middle; margin: 0 4px; background: #c0c0c0; border: 1px solid #808080; padding: 2px;"> на верхней панели.`,
        validate: (e) => !!e.target.closest('#tut-btn-class-filter')
    },

    // --- 3. ИСПОЛЬЗОВАНИЕ ОКНА (ВТОРОЙ СПОСОБ – СПИСОК С СУММАМИ) ---
    {
        delay: 600,
        targetSelector: '#class-filter-modal > div',
        eventType: 'click',
        placement: 'left',
        text: `Это окно — реализация <b>второго способа</b> фильтрации.<br><br>
        Здесь все классы дефектов выведены в виде списка, и рядом с каждым указано <b>суммарное количество инцидентов</b> на текущем рулоне. Такой формат особенно удобен, когда нужно быстро оставить на карте только нужные классы из разных групп — вы видите числовые приоритеты и можете принимать решение на основе статистики.<br><br>
        <b>1.</b> Снимите галочки с одного или нескольких пунктов внутри любой группы (но не гасите группу полностью).<br>
        <b>2.</b> Нажмите <span class="action-badge">Ok</span> для применения.`,
        validate: (e) => {
            const btn = e.target.closest('button');
            return btn && btn.innerText.trim() === 'Ok';
        }
    },

    // --- 4. РАБОТА С ЖЕЛТЫМ БЛОКОМ ---
    {
        delay: 800,
        onEnter: () => {
            let targetBlock = document.querySelector('#content-classes .filter-block.yellow') ||
                              document.querySelector('#content-classes .filter-block.inactive');
            if (!targetBlock) {
                const firstBlock = document.querySelector('#content-classes .filter-block');
                if (firstBlock) {
                    firstBlock.classList.remove('active');
                    firstBlock.classList.add('yellow');
                    targetBlock = firstBlock;
                }
            }
            if (targetBlock) {
                window.tutModifiedClass = targetBlock.dataset.value;
            }
        },
        targetSelector: () => `.filter-block[data-value="${window.tutModifiedClass}"]`,
        eventType: 'click',
        placement: 'bottom',
        text: () => {
            const el = document.querySelector(`.filter-block[data-value="${window.tutModifiedClass}"]`);
            if (el && el.classList.contains('yellow')) {
                return `Отлично! Вы выключили некоторые подклассы, поэтому блок окрасился в <span style="color: #ffdc00; text-shadow: 0 0 2px black;">ЖЕЛТЫЙ ЦВЕТ</span>, а перед названием появилась звездочка (*).<br>
                <div class="purpose-text">
                    <b>Желтый цвет</b> всегда информирует: <i>Внимание, в этом классе часть дефектов скрыта вручную!</i> Скрытые типы вычтены из итоговой статистики.
                </div>
                Сделайте <span class="action-badge">ЛЕВЫЙ КЛИК</span> по этому желтому блоку, чтобы моментально вырубить всю группу целиком.`;
            } else {
                return `Вы отключили вообще все галочки в этом классе, поэтому блок стал <b>красным</b>. Если бы вы оставили часть, он бы сигнализировал желтым.<br><br>
                Сделайте <span class="action-badge">ЛЕВЫЙ КЛИК</span> по этому блоку.`;
            }
        },
        validate: (e) => {
            const el = e.target.closest('.filter-block');
            return el && el.dataset.value === window.tutModifiedClass;
        }
    },

    // --- 5. ВЫКЛЮЧЕНО / ВОССТАНОВЛЕНИЕ ---
    {
        delay: 500,
        targetSelector: () => `.filter-block[data-value="${window.tutModifiedClass}"]`,
        eventType: 'click',
        placement: 'top',
        text: () => {
            const el = document.querySelector(`.filter-block[data-value="${window.tutModifiedClass}"]`);
            if (el && el.classList.contains('inactive')) {
                return `Теперь блок стал привычно <b>красным</b> (все подклассы выключены).<br><br>
                Сделайте <span class="action-badge">последний клик</span> по этому блоку: это сбросит все предыдущие "желтые" параметры и одним махом включит группу на 100%.`;
            } else {
                return `Группа успешно активирована.<br><br>Кликните по ней еще раз для завершения обучения.`;
            }
        },
        validate: (e) => {
            const el = e.target.closest('.filter-block');
            return el && el.dataset.value === window.tutModifiedClass;
        }
    },

    // --- 6. АЛЬТЕРНАТИВНЫЙ ПУТЬ, ЧАСТЬ 1: ПОДСВЕЧИВАЕМ "КАРТА РУЛОНА" ---
    {
        delay: 800,
        onEnter: () => {
            const menu = document.getElementById('coil-map-menu');
            if (menu) {
                menu.style.setProperty('display', 'block', 'important');
                menu.style.setProperty('visibility', 'visible', 'important');
                menu.style.setProperty('opacity', '1', 'important');
            }
        },
        targetSelector: '.menu-item[data-menu="coil-map"]',
        eventType: ['mouseenter', 'click'],
        placement: 'corner',
        text: `Отлично! Мы разобрались с фильтром через панель инструментов.<br><br>
        <div class="purpose-text">
            На деле в ODIS почти к любому инструменту можно прийти <i>двумя путями</i> — быстрым (тулбар) и через главное меню. Давайте откроем то же самое окно вторым способом.
        </div>
        Пункт меню <span class="action-badge">"Карта рулона"</span> подсвечен и его список уже раскрыт. Переместите курсор на подсвеченный пункт, чтобы перейти дальше.`,
        validate: (e) => !!e.target.closest('.menu-item[data-menu="coil-map"]')
    },

    // --- 7. АЛЬТЕРНАТИВНЫЙ ПУТЬ, ЧАСТЬ 2: КЛИК ПО ПУНКТУ "ВЫБРАТЬ КЛАСС ДЕФЕКТОВ..." ---
    {
        delay: 300,
        targetSelector: '.dropdown-item[onclick="openClassSelectModal()"]',
        eventType: 'click',
        placement: 'right',
        text: `Меню открыто.<br><br>Теперь кликните на пункт <b>"Выбрать класс дефектов..."</b> — он ведёт в то же самое диалоговое окно, что мы уже видели (второй способ фильтрации).`,
        validate: (e) => !!e.target.closest('.dropdown-item[onclick="openClassSelectModal()"]'),
        onExit: () => {
            const menu = document.getElementById('coil-map-menu');
            if (menu) {
                menu.style.removeProperty('display');
                menu.style.removeProperty('visibility');
                menu.style.removeProperty('opacity');
            }
        }
    },

    // --- 8. ПОДТВЕРЖДЕНИЕ, ЧТО ОКНО ТО ЖЕ САМОЕ ---
    {
        delay: 500,
        targetSelector: '#class-filter-modal > div',
        eventType: 'click',
        placement: 'left',
        text: `Вот мы снова здесь!<br><br>
        <div class="purpose-text">
            Это то же самое окно управления подклассами — оно единое для всей системы, и не важно, откуда вы его открыли: с тулбара или из меню <b>"Карта рулона"</b>.
        </div>
        Нажмите любую кнопку — <span class="action-badge">Ok</span> или <span class="action-badge">Отмена</span> — чтобы закрыть окно и завершить обучение.`,
        validate: (e) => {
            const btn = e.target.closest('button');
            if (!btn) return false;
            const t = btn.innerText.trim();
            return t === 'Ok' || t === 'Отмена' || t === 'Cancel';
        }
    }
];

    // ==========================================
    // ДВИЖОК
    // ==========================================
    function renderStep() {
        if (currentStep >= steps.length) {
            // Никакого визуального лоадера — просто пауза 3-5 сек,
            // чтобы пользователь увидел применённый результат на карте,
            // а затем сразу появляется финальное окно.
            tooltip.style.display = 'none';
            if (activeTarget) {
                activeTarget.classList.remove('tutorial-target');
                activeTarget = null;
            }
            const randomDelay = 1000 + Math.random() * 1000;
            setTimeout(finishScenario, randomDelay);
            return;
        }

        const step = steps[currentStep];
        isTransitioning = false;

        if (step.delay && !step._delayed) {
            step._delayed = true;
            tooltip.style.display = 'none';
            isTransitioning = true;
            if (activeTarget) activeTarget.classList.remove('tutorial-target');
            setTimeout(renderStep, step.delay);
            return;
        }

        if (step.onEnter && !step._entered) {
            step._entered = true;
            step.onEnter();
        }

        // Динамический селектор подставляется "на ходу"
        const targetSelectorStr = typeof step.targetSelector === 'function' ? step.targetSelector() : step.targetSelector;
        const targetEl = document.querySelector(targetSelectorStr);

        if (!targetEl) {
            setTimeout(renderStep, 100);
            return;
        }

        targetEl.classList.add('tutorial-target');
        activeTarget = targetEl;
        currentPlacement = step.placement;

        tooltip.innerHTML = typeof step.text === 'function' ? step.text() : step.text;
        tooltip.style.display = 'block';
        updateTooltipPosition();

        if (typeof targetEl.focus === 'function' && !step.eventType.includes('keydown')) {
            targetEl.focus({ preventScroll: true });
        }

        const eventsToListen = Array.isArray(step.eventType) ? step.eventType : [step.eventType];

        activeListener = function(e) {
            if (step.validate(e)) {
                // Если validation вернула true, переключаем шаг
                eventsToListen.forEach(evt => window.removeEventListener(evt, activeListener, true));
                if (activeTarget) activeTarget.classList.remove('tutorial-target');

                // Хук очистки, если шаг что-то принудительно менял в DOM
                // (например, раскрывал меню) — возвращаем состояние обратно
                if (step.onExit) step.onExit();

                setTimeout(() => {
                    currentStep++;
                    renderStep();
                }, 10);
            }
        };

        eventsToListen.forEach(evt => window.addEventListener(evt, activeListener, true));
    }

    function finishScenario() {
        tooltip.style.display = 'none';
        activeTarget = null;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 200000; display: flex; justify-content: center; align-items: center;';

        const win = document.createElement('div');
        win.style.cssText = 'background-color: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 6px; width: 450px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column;';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 12px 5px 12px;';
        header.innerHTML = `<span style="color: #000; font-size: 12px; font-family: Tahoma, sans-serif; font-weight: bold;">Обучение завершено</span><button style="background: transparent; border: none; font-size: 18px; color: #555; cursor: pointer; padding: 0; line-height: 10px;">×</button>`;

        const body = document.createElement('div');
        body.style.cssText = 'padding: 20px 25px; font-size: 13px; color: black; font-family: Tahoma, sans-serif; text-align: center; line-height: 1.5;';
        body.innerHTML = '<b>Сценарий #8 успешно пройден!</b><br><br>Теперь вы умеете отсекать маловажные дефекты через окно глобального фильтра подклассов — и знаете, что попасть в него можно двумя путями: через тулбар или через меню «Карта рулона». Это оставит активной только ту информацию, которая напрямую угрожает техпроцессу.';

        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; justify-content: center; padding-bottom: 20px;';
        const btn = document.createElement('button');
        btn.innerText = 'Хорошо';
        btn.style.cssText = 'width: 85px; height: 24px; cursor: pointer; color: black; background: #f0f0f0; border-top: 1px solid white; border-left: 1px solid white; border-bottom: 2px solid #808080; border-right: 2px solid #808080; font-size: 12px; font-family: Tahoma, sans-serif; outline: none;';

        btn.onmousedown = () => { btn.style.borderTop = '2px solid #808080'; btn.style.borderLeft = '2px solid #808080'; btn.style.borderBottom = '1px solid white'; btn.style.borderRight = '1px solid white'; btn.style.paddingTop = '1px'; btn.style.paddingLeft = '1px'; };
        btn.onmouseup = () => { btn.style.borderTop = '1px solid white'; btn.style.borderLeft = '1px solid white'; btn.style.borderBottom = '2px solid #808080'; btn.style.borderRight = '2px solid #808080'; btn.style.paddingTop = '0'; btn.style.paddingLeft = '0'; };

        // Закрываем окно, не покидая текущий экран и не перезагружая систему
        const closeAlert = () => { overlay.remove(); };
        btn.onclick = closeAlert;
        header.querySelector('button').onclick = closeAlert;

        footer.appendChild(btn);
        win.appendChild(header);
        win.appendChild(body);
        win.appendChild(footer);
        overlay.appendChild(win);
        document.body.appendChild(overlay);
    }

    setTimeout(renderStep, 500);
})();
