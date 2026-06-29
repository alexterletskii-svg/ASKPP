// --- ДВИЖОК ОБУЧАЮЩИХ СЦЕНАРИЕВ: СЦЕНАРИЙ №4 ---
(function initScenarioEngine() {
    const style = document.createElement('style');
    style.innerHTML = `
        .tutorial-target {
            position: relative !important;
            box-shadow: 0 0 0 3px rgba(242, 101, 34, 1), 0 0 15px rgba(242, 101, 34, 0.8) !important;
            outline: none !important;
            border-radius: 2px;
            z-index: 100001 !important;
            animation: pulse-highlight 2s infinite;
        }
        @keyframes pulse-highlight {
            0%, 100% { box-shadow: 0 0 0 3px rgba(242, 101, 34, 1), 0 0 15px rgba(242, 101, 34, 0.8); }
            50% { box-shadow: 0 0 0 5px rgba(242, 101, 34, 1), 0 0 25px rgba(242, 101, 34, 1); }
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
            max-width: 400px;
            pointer-events: none;
            transition: opacity 0.3s;
            line-height: 1.6;
            border: 1px solid #4a90d9;
        }
        #tutorial-tooltip::after {
            content: ''; position: absolute; border: 8px solid transparent;
        }
        #tutorial-tooltip.arrow-left::after {
            top: 50%; left: -16px; transform: translateY(-50%); border-right-color: #0056a4;
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
            font-size: 16px;
            color: #ffda44;
            letter-spacing: 0.5px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        .purpose-text {
            background-color: rgba(0, 86, 164, 0.5);
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 10px;
            border-left: 3px solid #ffda44;
            font-size: 12px;
            line-height: 1.4;
        }
        .purpose-title {
            font-weight: bold;
            color: #ffda44;
            display: block;
            margin-bottom: 4px;
        }
        .tooltip-note {
            font-size: 11px; color: #b3d4f5; margin-top: 8px; display: block; line-height: 1.3;
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
        regenerateSystemData('DQS_CAL4');
    }

    // ==========================================
    // БЛОКИРОВЩИК
    // ==========================================
    let activeTarget = null;
    let currentPlacement = 'right';
    let isTransitioning = false;

    document.addEventListener('mousedown', function(e) {
        if (!e.isTrusted) return;
        if (isTransitioning) { e.preventDefault(); e.stopPropagation(); return; }
        if (activeTarget && !activeTarget.contains(e.target)) {
            e.preventDefault(); e.stopPropagation();
        }
    }, true);

    document.addEventListener('click', function(e) {
        if (!e.isTrusted) return;
        if (isTransitioning) { e.preventDefault(); e.stopPropagation(); return; }
        if (activeTarget && !activeTarget.contains(e.target)) {
            e.preventDefault(); e.stopPropagation();
        }
    }, true);

    document.addEventListener('contextmenu', function(e) {
        if (!e.isTrusted) return;
        if (isTransitioning) { e.preventDefault(); e.stopPropagation(); return; }
        if (activeTarget && !activeTarget.contains(e.target)) {
            e.preventDefault(); e.stopPropagation();
        }
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
            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 15) + 'px';
            tooltip.className = 'arrow-bottom';
        }
        else if (currentPlacement === 'center') {
            tooltip.style.left = (window.innerWidth / 2 - tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = (window.innerHeight / 2 - tooltip.offsetHeight / 2) + 'px';
            tooltip.className = '';
        }
        else if (currentPlacement === 'bottom-right') {
            tooltip.style.left = (window.innerWidth - tooltip.offsetWidth - 30) + 'px';
            tooltip.style.top = (window.innerHeight - tooltip.offsetHeight - 40) + 'px';
            tooltip.className = '';
        }
    }
    window.addEventListener('resize', updateTooltipPosition);

    function showCustomAlert(message, onOk) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); z-index: 200000; display: flex; justify-content: center; align-items: center;';
        const win = document.createElement('div');
        win.style.cssText = 'background-color: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 6px; width: 450px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column;';
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 12px 5px 12px;';
        header.innerHTML = `<span style="color: #000; font-size: 12px; font-family: Tahoma, sans-serif; font-weight: bold;">Уведомление системы</span><button id="tut-alert-close" style="background: transparent; border: none; font-size: 18px; color: #555; cursor: pointer; padding: 0; line-height: 10px;">×</button>`;
        const body = document.createElement('div');
        body.style.cssText = 'padding: 20px 25px; font-size: 13px; color: black; font-family: Tahoma, sans-serif; text-align: center; line-height: 1.5;';
        body.innerHTML = message;
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; justify-content: center; padding-bottom: 20px;';
        const btn = document.createElement('button');
        btn.innerText = 'Ok';
        btn.style.cssText = 'width: 75px; height: 24px; cursor: pointer; color: black; background: #f0f0f0; border-top: 1px solid white; border-left: 1px solid white; border-bottom: 2px solid #808080; border-right: 2px solid #808080; font-size: 12px; font-family: Tahoma, sans-serif; outline: none;';

        btn.onmousedown = () => { btn.style.borderTop = '2px solid #808080'; btn.style.borderLeft = '2px solid #808080'; btn.style.borderBottom = '1px solid white'; btn.style.borderRight = '1px solid white'; btn.style.paddingTop = '1px'; btn.style.paddingLeft = '1px'; };
        btn.onmouseup = () => { btn.style.borderTop = '1px solid white'; btn.style.borderLeft = '1px solid white'; btn.style.borderBottom = '2px solid #808080'; btn.style.borderRight = '2px solid #808080'; btn.style.paddingTop = '0'; btn.style.paddingLeft = '0'; };

        const closeAlert = () => { overlay.remove(); if (onOk) onOk(); };
        btn.onclick = closeAlert;

        footer.appendChild(btn); win.appendChild(header); win.appendChild(body); win.appendChild(footer); overlay.appendChild(win); document.body.appendChild(overlay);
        document.getElementById('tut-alert-close').onclick = closeAlert;
    }

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
            text: 'Добро пожаловать в обучение!<br><br>Сначала давайте загрузим данные. Кликните по <span class="action-badge">ЛЮБОМУ</span> рулону в таблице слева.',
            purpose: 'Выбор рулона подгрузит его карту дефектов, чтобы мы могли анализировать данные и фильтровать информацию с разных камер.',
            validate: (e) => {
                const tr = e.target.closest('#coil-tbody tr');
                if (tr) {
                    return true;
                }
                return false;
            }
        },

        // --- 2. ВЫКЛЮЧЕНИЕ ВСЕХ КАМЕР ---
        {
            delay: 800,
            targetSelector: '.filter-group:nth-child(2) .filter-actions button:nth-child(2)',
            eventType: 'click',
            placement: 'bottom',
            text: 'Тренировка работы с фильтрами камер.<br><br>Сначала отключим все камеры, чтобы очистить карту для анализа.<br><br>Нажмите кнопку <span class="action-badge">Все выкл.</span>',
            purpose: 'Это действие отключит отображение дефектов со всех камер, чтобы мы могли постепенно включать нужные камеры и анализировать их по отдельности.',
            validate: () => true
        },

        // --- 3. ВКЛЮЧЕНИЕ ОДНОЙ КАМЕРЫ ---
        {
            delay: 200,
            targetSelector: '#content-cameras',
            eventType: 'click',
            placement: 'bottom',
            text: 'Все камеры отключены. Теперь включим одну камеру для анализа.<br><br>Кликните по камере <span class="action-badge">01 Низ LF</span>',
            purpose: 'Камера 01 Низ LF - это левая фронтальная камера, которая сканирует нижнюю (обратную) сторону рулона. Она показывает дефекты с левой стороны.',
            validate: (e) => {
                const target = e.target.closest('.filter-block');
                if (!target) return false;
                const cameraName = target.innerText.trim();
                return cameraName === '01 Низ LF';
            }
        },

        // --- 4. ВКЛЮЧЕНИЕ ВТОРОЙ КАМЕРЫ ---
        {
            delay: 300,
            targetSelector: '#content-cameras',
            eventType: 'click',
            placement: 'bottom',
            text: 'Отлично! Теперь включим вторую камеру для полного анализа нижней стороны.<br><br>Кликните по камере <span class="action-badge">02 Низ LF</span>',
            purpose: 'Камера 02 Низ LF - вторая левая фронтальная камера, которая дополняет обзор нижней стороны. Вместе с камерой 01 они обеспечивают полное покрытие левой части рулона.',
            validate: (e) => {
                const target = e.target.closest('.filter-block');
                if (!target) return false;
                const cameraName = target.innerText.trim();
                return cameraName === '02 Низ LF';
            }
        },

        // --- 5. ВКЛЮЧЕНИЕ ГРУППЫ КАМЕР ---
        {
            delay: 300,
            targetSelector: '#content-cameras',
            eventType: 'click',
            placement: 'bottom',
            text: 'Теперь давайте включим все камеры верхней стороны для полного анализа.<br><br>Кликните по кнопке <span class="action-badge">Верх LF</span> (справа от камер)',
            purpose: 'Кнопка "Верх LF" включает сразу все левые фронтальные камеры верхней стороны (камеры 05 и 06). Это удобно для быстрого переключения между сторонами рулона.',
            validate: (e) => {
                const target = e.target.closest('.filter-block');
                if (!target) return false;
                const groupName = target.innerText.trim();
                return groupName === 'Верх LF';
            }
        },

        // --- 6. ПРОВЕРКА РЕЗУЛЬТАТА (КЛИКИ ПО ДЕФЕКТАМ) ---
        {
            delay: 1000,
            onEnter: () => { window.tutCameraDefectClicks = 0; },
            targetSelector: '.workspace',
            eventType: 'click',
            placement: 'bottom-right',
            text: () => `На карте отображаются дефекты только с камер: 01 Низ LF, 02 Низ LF и Верх LF.<br><br>Кликните по <b>2 любым дефектам</b> на карте, чтобы посмотреть их данные.<br><br>Осталось кликнуть: <span class="action-badge">${2 - window.tutCameraDefectClicks}</span>`,
            purpose: 'Теперь вы видите только те дефекты, которые были обнаружены выбранными камерами. Это позволяет анализировать качество с конкретных позиций.',
            validate: (e) => {
                if (e.target.closest('#defects-tbody tr') || e.target.closest('.defect-lbl') || e.target.closest('.defect-real-block') || e.target.closest('.defect-real-cross')) {
                    window.tutCameraDefectClicks++;

                    setTimeout(() => {
                        if (steps[currentStep]) {
                            const stepTextRaw = steps[currentStep].text;
                            tooltip.innerHTML = typeof stepTextRaw === 'function' ? stepTextRaw() : stepTextRaw;
                        }
                    }, 10);

                    if (window.tutCameraDefectClicks >= 2) return true;
                }
                return false;
            }
        }
    ];

    function renderStep() {
        if (currentStep >= steps.length) {
            finishScenario();
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

        const targetEl = document.querySelector(step.targetSelector);

        if (!targetEl) {
            setTimeout(renderStep, 100);
            return;
        }

        targetEl.classList.add('tutorial-target');
        activeTarget = targetEl;
        currentPlacement = step.placement;

        let tooltipHTML = typeof step.text === 'function' ? step.text() : step.text;
        if (step.purpose) {
            tooltipHTML += `<div class="purpose-text"><span class="purpose-title"></span>${step.purpose}</div>`;
        }

        tooltip.innerHTML = tooltipHTML;
        tooltip.style.display = 'block';
        updateTooltipPosition();

        if (typeof targetEl.focus === 'function') targetEl.focus();

        const eventsToListen = Array.isArray(step.eventType) ? step.eventType : [step.eventType];

        activeListener = function(e) {
            if (step.validate(e)) {
                eventsToListen.forEach(evt => targetEl.removeEventListener(evt, activeListener, true));
                targetEl.classList.remove('tutorial-target');
                currentStep++;
                renderStep();
            }
        };

        eventsToListen.forEach(evt => targetEl.addEventListener(evt, activeListener, true));
    }

    function finishScenario() {
        tooltip.style.display = 'none';
        activeTarget = null;
        showCustomAlert('<b>Сценарий #5 успешно завершен!</b><br><br>Вы научились управлять фильтрами камер:<br>• Отключать все камеры<br>• Включать отдельные камеры<br>• Включать целые группы камер (Верх/Низ)<br><br>Это позволяет быстро анализировать дефекты с конкретных камер или сторон рулона.');
    }

    setTimeout(renderStep, 500);
})();