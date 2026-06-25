// --- ДВИЖОК ОБУЧАЮЩИХ СЦЕНАРИЕВ: СЦЕНАРИЙ №6 (ЛИНЕЙКА И ПАРАМЕТРЫ) ---
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
            max-width: 380px;
            pointer-events: none;
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
            if (leftPos < 10) { leftPos = 10; }
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
        // --- 1. ПЕРЕХОД В РЕЖИМ БОЛЬШОГО ИЗОБРАЖЕНИЯ ---
        {
            delay: 500,
            onEnter: () => {
                document.querySelectorAll('.sb-panel').forEach(b => {
                    const txt = b.innerText.trim();
                    if (txt === 'Большой') b.id = 'tut-btn-big';
                });
            },
            targetSelector: '#tut-btn-big',
            eventType: 'click',
            placement: 'top',
            text: 'Программный инструмент <b>"Линейка"</b> позволяет определять протяженность дефектов вдоль кромки, а на полосе — их длину и ширину.<br><br>Сначала давайте переключимся в режим отображения <b>Большой</b>.<br><br>Нажмите подсвеченную кнопку в правой части нижней панели.',
            validate: (e) => e.target.closest('#tut-btn-big') !== null
        },

        // --- 2. ИСПОЛЬЗОВАНИЕ ЛИНЕЙКИ (ПЕРВЫЙ ЗАМЕР) ---
        {
            delay: 800,
            targetSelector: '#defect-image-box',
            eventType: ['mouseup'],
            placement: 'center',
            text: 'Отлично! Картинка увеличилась, и теперь мы можем измерить конкретный участок дефекта.<br><br>Чтобы нарисовать линейку, выполните 3 простых шага:<br><br>1. Наведите курсор мыши на фотографию.<br>2. Нажмите и <b>не отпускайте</b> клавишу <span class="action-badge">Ctrl</span> на клавиатуре.<br>3. <b>Зажмите левую кнопку мыши</b> и потяните курсор в любую сторону (так же, как вы выделяете файлы на рабочем столе).<br><br>Сделайте это прямо сейчас!',
            validate: (e) => {
                if (document.querySelector('.img-ruler-text')) {
                    return true;
                }
                return false;
            }
        },

        // --- 3. ЗАКРЕПЛЕНИЕ (РАЗБОР ПАРАМЕТРОВ И ВТОРОЙ ЗАМЕР) ---
        {
            delay: 100,
            onEnter: () => {
                const existingText = document.querySelector('.img-ruler-text');
                window.lastRulerText = existingText ? existingText.innerHTML : '';
            },
            targetSelector: '#defect-image-box',
            eventType: ['mouseup'],
            placement: 'bottom-right',
            text: 'Отличная работа!<br>Обратите внимание на появившиеся цифры. Они показывают физические размеры выделенного отрезка:<br><br>• <span class="action-badge">X (мм)</span> — проекция по ширине листа (поперек движения полосы).<br>• <span class="action-badge">Y (мм)</span> — проекция по длине листа (вдоль кромки рулона).<br>• <span class="action-badge">Длина (мм)</span> — точное расстояние по нарисованной вами диагонали.<br><br>Чтобы сделать новый замер, старый стирать не нужно. <b>Просто зажмите <span class="action-badge">Ctrl</span> и потяните мышку снова.</b><br><br>Закрепим навык: проведите <b>еще одну новую линию</b>.',
            validate: (e) => {
                const textEl = document.querySelector('.img-ruler-text');
                // Проверяем, что текст изменился (сделана новая линия)
                if (textEl && textEl.innerHTML !== window.lastRulerText) {
                    return true;
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

        if (typeof targetEl.focus === 'function' && !step.eventType.includes('keydown')) {
            targetEl.focus({ preventScroll: true });
        }

        const eventsToListen = Array.isArray(step.eventType) ? step.eventType : [step.eventType];

        activeListener = function(e) {
            if (step.validate(e)) {
                eventsToListen.forEach(evt => window.removeEventListener(evt, activeListener, true));
                if (activeTarget) activeTarget.classList.remove('tutorial-target');

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
        showCustomAlert('<b>Сценарий #6 успешно завершен!</b><br><br>Вы научились пользоваться инструментом "Линейка", а также знаете, за что отвечают параметры X, Y и общей длины. Это поможет вам быстро вычислять точные габариты дефектов прямо на фотографиях с камер.');
    }

    setTimeout(renderStep, 500);
})();