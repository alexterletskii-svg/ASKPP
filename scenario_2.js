// --- ДВИЖОК ОБУЧАЮЩИХ СЦЕНАРИЕВ: СЦЕНАРИЙ №2 ---
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
            padding: 15px 20px;
            border-radius: 6px;
            font-family: 'Tahoma', sans-serif;
            font-size: 13px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 100002;
            width: max-content;
            max-width: 350px;
            pointer-events: none;
            transition: opacity 0.3s;
            line-height: 1.5;
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
        .action-badge {
            font-weight: bold;
            font-size: 15px;
            color: #ffda44;
            letter-spacing: 0.5px;
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

    document.addEventListener('keydown', function(e) {
        if (activeTarget && e.key === 'Tab') {
            e.preventDefault(); e.stopPropagation();
            const input = activeTarget.querySelector('input');
            if (input) input.focus();
            else if(typeof activeTarget.focus === 'function') activeTarget.focus();
        }
    }, true);

    // ==========================================
    // УМНОЕ ПОЗИЦИОНИРОВАНИЕ
    // ==========================================
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
        else if (currentPlacement === 'center') {
            tooltip.style.left = (window.innerWidth / 2 - tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = (window.innerHeight / 2 - tooltip.offsetHeight / 2) + 'px';
            tooltip.className = '';
        }
        else if (currentPlacement === 'bottom-right') {
            // Новое положение: в правом нижнем углу, чтобы не мешать карте
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
        win.style.cssText = 'background-color: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 6px; width: 350px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column;';
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
        {
            targetSelector: '#init-select', eventType: 'change', placement: 'right',
            text: 'Тренировка выполнения поиска по рулону.<br><br>Сперва выберите систему:<br><span class="action-badge">DQS_CAL6</span>',
            validate: (e) => e.target.value === 'DQS_CAL6'
        },
        {
            targetSelector: '#init-username', eventType: 'input', placement: 'right',
            text: 'Логин:<br><span class="action-badge">Admin</span>',
            validate: (e) => e.target.value === 'Admin'
        },
        {
            targetSelector: '#init-password', eventType: 'input', placement: 'right',
            text: 'Пароль:<br><span class="action-badge">Admin</span>',
            validate: (e) => e.target.value === 'Admin'
        },
        {
            targetSelector: '#initial-screen button', eventType: 'click', placement: 'right',
            text: 'Загрузите данные базы:<br><span class="action-badge">Ok</span>',
            validate: () => true
        },
        {
            delay: 2500,
            targetSelector: '.tb-btn[title="Поиск рулона"]',
            eventType: 'click',
            placement: 'bottom',
            text: 'База загружена. Нажмите на иконку <span class="action-badge">Поиск рулона</span>.',
            validate: () => true
        },
        {
            delay: 300,
            onEnter: () => {
                const row = document.querySelector('#coil-tbody tr:nth-child(8)');
                if (row) {
                    window.targetCoilNum = row.cells[1].innerText.trim();
                    window.targetCoilId = row.cells[0].innerText.trim();
                } else {
                    window.targetCoilNum = '6796763';
                    window.targetCoilId = '6041777';
                }
                window.alertShown = false;
            },
            targetSelector: '#roll-search-modal .modal-window',
            eventType: ['click', 'keyup'],
            placement: 'bottom',
            text: () => `Открыто меню выбора.<br><br>Найдите и выберите рулон <span class="action-badge">${window.targetCoilNum}</span>.<br><br><span class="tooltip-note">Кликните по нему в списке <b>ИЛИ</b> введите номер вручную.<br>В конце обязательно нажмите кнопку <b>ОК</b> (или <b>Enter</b>).</span>`,
            validate: (e) => {
                const val = document.getElementById('roll-search-input').value.trim();
                const isMatch = (val === window.targetCoilNum || val === window.targetCoilId);

                const btnText = e.target.innerText ? e.target.innerText.trim().toLowerCase() : '';
                const isOkClick = e.type === 'click' && e.target.tagName === 'BUTTON' && (btnText === 'ок' || btnText === 'ok');
                const isEnter = e.type === 'keyup' && e.key === 'Enter';

                if (isOkClick || isEnter) {
                    if (isMatch) return true;

                    if (!window.alertShown) {
                        window.alertShown = true;
                        e.preventDefault(); e.stopPropagation();
                        showCustomAlert(`Вы выбрали неверный рулон!<br><br>Пожалуйста, выберите <b>${window.targetCoilNum}</b>.`, () => {
                            window.alertShown = false;
                        });
                    }
                    return false;
                }

                const isCloseClick = e.type === 'click' && e.target.tagName === 'BUTTON' && (btnText === 'выход' || btnText === '×');
                if (isCloseClick) {
                    if (!window.alertShown) {
                        window.alertShown = true;
                        e.preventDefault(); e.stopPropagation();
                        showCustomAlert('Вы обязаны выбрать рулон для продолжения работы!', () => {
                            window.alertShown = false;
                        });
                    }
                    return false;
                }
                return false;
            }
        },

        // --- 3. ИЗУЧЕНИЕ ДЕФЕКТОВ (ИЗМЕНЕНО РАСПОЛОЖЕНИЕ) ---
        {
            delay: 1500,
            onEnter: () => { window.tutDefectClicks = 0; },
            targetSelector: '.workspace',
            eventType: 'click',
            placement: 'bottom-right', // <--- Теперь выводится тут!
            text: () => `Отличная работа! Рулон <span style="color:#ffda44">${window.targetCoilNum}</span> загружен.<br><br>Теперь кликните по <b>2 любым дефектам</b> на карте или в таблице, чтобы посмотреть их свойства.<br><br>Осталось кликнуть: <span class="action-badge">${2 - window.tutDefectClicks}</span>`,
            validate: (e) => {
                if (e.target.closest('#defects-tbody tr') || e.target.closest('.defect-lbl') || e.target.closest('.defect-real-block') || e.target.closest('.defect-real-cross')) {
                    window.tutDefectClicks++;

                    setTimeout(() => {
                        if (steps[currentStep]) {
                            const stepTextRaw = steps[currentStep].text;
                            tooltip.innerHTML = typeof stepTextRaw === 'function' ? stepTextRaw() : stepTextRaw;
                        }
                    }, 10);

                    if (window.tutDefectClicks >= 2) return true;
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

        tooltip.innerHTML = typeof step.text === 'function' ? step.text() : step.text;
        tooltip.style.display = 'block';
        updateTooltipPosition();

        if (typeof targetEl.focus === 'function') targetEl.focus();
        if (step.targetSelector === '#init-username' || step.targetSelector === '#init-password') {
            targetEl.value = '';
        }

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
        showCustomAlert('<b>Сценарий #2 успешно пройден!</b><br><br>Вы научились выполнять поиск рулона и просматривать свойства локализованных дефектов.');
    }

    setTimeout(renderStep, 500);
})();