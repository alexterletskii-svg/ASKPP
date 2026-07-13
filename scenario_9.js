// --- ДВИЖОК ОБУЧАЮЩИХ СЦЕНАРИЕВ: СЦЕНАРИЙ №9 (ЧАСТИЧНЫЕ ДЕФЕКТЫ) ---
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
            max-width: 460px;
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
            text: 'Добро пожаловать в обучение!<br><br>Сегодня мы разберем продвинутый метод анализа — инструмент детализации составных дефектов.<br><br>Для начала загрузите данные — кликните по <span class="action-badge">ЛЮБОМУ</span> рулону в левой таблице 2 раза.',
            validate: (e) => !!e.target.closest('#coil-tbody tr')
        },

        // --- 2. КОНЦЕПЦИЯ И ВКЛЮЧЕНИЕ "Ч.ДЕФЕКТЫ" ---
        {
            delay: 1000,
            onEnter: () => {
                // Привязываем ID к нужной кнопке
                document.querySelectorAll('.sb-panel').forEach(b => {
                    if (b.innerText.trim() === 'Ч.дефекты') b.id = 'tut-btn-partial-defects';
                });
            },
            targetSelector: '#tut-btn-partial-defects',
            eventType: 'click',
            placement: 'top',
            text: `<div class="purpose-text">
                В процессе передачи информации о дефектах происходит процесс проверки и объединения повторяющихся дефектов с разных камер или периодических дефектов. Карта рулона изначально показывает <b>объединенные</b> дефекты.
            </div>
            Однако, пользователь может в любой момент отобразить все скрытые части объединенного дефекта для более детального исследования.<br><br>
            Нажмите на кнопку <span class="action-badge">Ч.дефекты</span> в нижней панели под картой рулона.`,
            validate: (e) => !!e.target.closest('#tut-btn-partial-defects')
        },

        // --- 3. ИЗУЧЕНИЕ ОТКРЫВШИХСЯ ДЕФЕКТОВ НА КАРТЕ ---
        {
            delay: 600,
            onEnter: () => { window.tutPartClicks = 0; },
            targetSelector: '.workspace',
            eventType: 'click',
            placement: 'bottom-right',
            text: () => `Отлично! Вы включили режим отображения частичных дефектов.<br><br>
            <div class="purpose-text">
                В результате крупные блоки или одиночные сгруппированные ярлыки <b>разбиваются на мельчайшие</b>. Если вы обратите внимание на синий заголовок над картой, то увидите, что общее число дефектов увеличилось.
            </div>
            Изображение и параметры каждой мельчайшей части теперь можно детально рассмотреть.<br>Кликните по <b>2 любым дефектам</b> на карте.<br><br>
            Осталось кликнуть: <span class="action-badge">${2 - window.tutPartClicks}</span>`,
            validate: (e) => {
                if (e.target.closest('.defect-lbl') || e.target.closest('.defect-real-block') || e.target.closest('.defect-real-cross')) {
                    window.tutPartClicks++;
                    tooltip.innerHTML = steps[currentStep].text();
                    if (window.tutPartClicks >= 2) return true;
                }
                return false;
            }
        },

        // --- 4. ВЫКЛЮЧЕНИЕ "Ч.ДЕФЕКТЫ" ---
        {
            delay: 600,
            targetSelector: '#tut-btn-partial-defects',
            eventType: 'click',
            placement: 'top',
            text: `Режим детальной разбивки дает максимум информации для технолога, однако при быстром аудите множественные мелкие элементы могут "зашумлять" визуальную картину.<br><br>
            Поэтому после изучения деталей рекомендуется возвращать этот режим в исходное состояние.<br><br>
            Нажмите кнопку <span class="action-badge">Ч.дефекты</span> еще раз, чтобы <b>выключить</b> его.`,
            validate: (e) => !!e.target.closest('#tut-btn-partial-defects')
        }
    ];

    // ==========================================
    // ДВИЖОК ОТОБРАЖЕНИЯ ШАГОВ
    // ==========================================
    function renderStep() {
        if (currentStep >= steps.length) {
            tooltip.style.display = 'none';
            if (activeTarget) {
                activeTarget.classList.remove('tutorial-target');
                activeTarget = null;
            }
            const randomDelay = 800 + Math.random() * 500;
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
                eventsToListen.forEach(evt => window.removeEventListener(evt, activeListener, true));
                if (activeTarget) activeTarget.classList.remove('tutorial-target');

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
        body.innerHTML = '<b>Сценарий #9 успешно пройден!</b><br><br>Теперь вы умеете переключаться между базовым (объединенным) и детализированным отображением информации о дефектах. Эта функция поможет, когда нужно "разобрать на кусочки" протяженный дефект и оценить каждый кадр с камеры в отдельности.';

        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; justify-content: center; padding-bottom: 20px;';
        const btn = document.createElement('button');
        btn.innerText = 'Хорошо';
        btn.style.cssText = 'width: 85px; height: 24px; cursor: pointer; color: black; background: #f0f0f0; border-top: 1px solid white; border-left: 1px solid white; border-bottom: 2px solid #808080; border-right: 2px solid #808080; font-size: 12px; font-family: Tahoma, sans-serif; outline: none;';

        btn.onmousedown = () => { btn.style.borderTop = '2px solid #808080'; btn.style.borderLeft = '2px solid #808080'; btn.style.borderBottom = '1px solid white'; btn.style.borderRight = '1px solid white'; btn.style.paddingTop = '1px'; btn.style.paddingLeft = '1px'; };
        btn.onmouseup = () => { btn.style.borderTop = '1px solid white'; btn.style.borderLeft = '1px solid white'; btn.style.borderBottom = '2px solid #808080'; btn.style.borderRight = '2px solid #808080'; btn.style.paddingTop = '0'; btn.style.paddingLeft = '0'; };

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