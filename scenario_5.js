// --- ДВИЖОК ОБУЧАЮЩИХ СЦЕНАРИЕВ: СЦЕНАРИЙ №5 (ИЗОБРАЖЕНИЯ И ЗУМ) ---
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
        win.style.cssText = 'background-color: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 6px; width: 400px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column;';
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
        // --- 1. РЕЖИМ БОЛЬШОГО ИЗОБРАЖЕНИЯ ---
        {
            delay: 500,
            onEnter: () => {
                document.querySelectorAll('.sb-panel').forEach(b => {
                    const txt = b.innerText.trim();
                    if (txt === 'Большой') b.id = 'tut-btn-big';
                    if (txt === 'Rol') b.id = 'tut-btn-rol';
                });
            },
            targetSelector: '#tut-btn-big',
            eventType: 'click',
            placement: 'top',
            text: 'Тренировка работы с изображениями и масштабированием.<br><br>Переведем рабочую область в режим детального просмотра дефекта.<br><br>Нажмите кнопку <span class="action-badge">Большой</span> в правой части нижней панели.',
            validate: (e) => e.target.closest('#tut-btn-big') !== null
        },

        // --- 2. ЗУМ НА ФОТОГРАФИИ ---
        {
            delay: 800,
            onEnter: () => { window.tutZoomHits = 0; },
            targetSelector: '#defect-image-box',
            eventType: ['mousedown', 'wheel', 'contextmenu'],
            placement: 'center',
            text: () => `Окно фотографии поддерживает <b>управление масштабом (Зум)</b>.<br>• ЛКМ (или Колесо ВВЕРХ) — <span style="color:#7fff7f">приблизить</span><br>• ПКМ (или Колесо ВНИЗ) — <span style="color:#ff7f7f">отдалить</span><br><br>Сделайте <b>2 действия</b> с масштабом.<br>Выполнено: <span class="action-badge">${window.tutZoomHits}/2</span>`,
            validate: (e) => {
                const imgBox = document.getElementById('defect-image-box');
                if (!imgBox || !imgBox.contains(e.target)) return false;

                if (e.type === 'contextmenu') e.preventDefault();

                let act = false;
                if (e.type === 'wheel') act = true;
                if (e.type === 'mousedown' && (e.button === 0 || e.button === 2)) act = true;

                if (act) {
                    window.tutZoomHits++;
                    tooltip.innerHTML = steps[currentStep].text();
                    if (window.tutZoomHits >= 2) return true;
                }
                return false;
            }
        },

        // --- 3. ПРОЛИСТЫВАНИЕ (3 РАЗА) ---
        {
            delay: 50,
            onEnter: () => { window.tutNavHits1 = 0; },
            targetSelector: '.workspace',
            eventType: 'keydown',
            placement: 'bottom-right',
            text: () => `Отлично! Вы можете пролистывать разные дефекты рулона с клавиатуры.<br><br>Нажимайте клавиши <span class="action-badge">ВНИЗ (↓)</span> или <span class="action-badge">ВВЕРХ (↑)</span>, чтобы сменить дефект.<br><br>Пролистайте раз: <span class="action-badge">${3 - window.tutNavHits1}</span>`,
            validate: (e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    window.tutNavHits1++;
                    tooltip.innerHTML = steps[currentStep].text();
                    if (window.tutNavHits1 >= 3) return true;
                }
                return false;
            }
        },

        // --- 4. ЗАКРЕПЛЕНИЕ ROI: ПЕРЕКЛЮЧИТЬ НА 1 ДЕФЕКТ ---
        {
            delay: 50,
            targetSelector: '.workspace',
            eventType: 'keydown',
            placement: 'bottom-right',
            text: 'Теперь изучим инструмент машинного зрения <b>ROI (Region of Interest)</b>.<br><br>Для начала нажмите <span class="action-badge">ВНИЗ (↓)</span>, чтобы перейти на новый чистый дефект.',
            validate: (e) => (e.key === 'ArrowDown' || e.key === 'ArrowUp')
        },

        // --- 5. ЗАКРЕПЛЕНИЕ ROI: ОТКЛЮЧИТЬ ---
        {
            delay: 50,
            targetSelector: '#tut-btn-rol',
            eventType: 'click',
            placement: 'top',
            text: 'По умолчанию дефект обведен красным контуром.<br><br>Нажмите на кнопку <span class="action-badge">Rol</span> в статус-баре, чтобы <b>ОТКЛЮЧИТЬ</b> обводку.',
            validate: (e) => e.target.closest('#tut-btn-rol') !== null
        },

        // --- 6. ЗАКРЕПЛЕНИЕ ROI: ВКЛЮЧИТЬ ---
        {
            delay: 50,
            targetSelector: '#tut-btn-rol',
            eventType: 'click',
            placement: 'top',
            text: 'Оцените, как выглядит металл. Некоторые царапины почти невидимы.<br><br>Нажмите кнопку <span class="action-badge">Rol</span> снова, чтобы <b>ВКЛЮЧИТЬ</b> обводку.',
            validate: (e) => e.target.closest('#tut-btn-rol') !== null
        },

        // --- 7. ЗАКРЕПЛЕНИЕ ROI: ПЕРЕКЛЮЧИТЬ НА СЛЕДУЮЩИЙ ДЕФЕКТ ---
        {
            delay: 50,
            targetSelector: '.workspace',
            eventType: 'keydown',
            placement: 'bottom-right',
            text: 'Повторим это еще раз для закрепления!<br><br>Нажмите <span class="action-badge">ВНИЗ (↓)</span> для перехода к следующему дефекту.',
            validate: (e) => (e.key === 'ArrowDown' || e.key === 'ArrowUp')
        },

        // --- 8. ЗАКРЕПЛЕНИЕ ROI: ОТКЛЮЧИТЬ ---
        {
            delay: 50,
            targetSelector: '#tut-btn-rol',
            eventType: 'click',
            placement: 'top',
            text: 'Снова нажмите кнопку <span class="action-badge">Rol</span>, чтобы <b>ОТКЛЮЧИТЬ</b> её.',
            validate: (e) => e.target.closest('#tut-btn-rol') !== null
        },

        // --- 9. ЗАКРЕПЛЕНИЕ ROI: ВКЛЮЧИТЬ И ЗАВЕРШИТЬ ---
        {
            delay: 50,
            targetSelector: '#tut-btn-rol',
            eventType: 'click',
            placement: 'top',
            text: 'И последний раз кликните <span class="action-badge">Rol</span>, чтобы <b>ВКЛЮЧИТЬ</b> её обратно.',
            validate: (e) => e.target.closest('#tut-btn-rol') !== null
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
        showCustomAlert('<b>Сценарий #5 успешно завершен!</b><br><br>Вы научились переключаться в режим детального просмотра дефекта, изменять масштаб картинки, а также использовать быструю навигацию клавиатурой и управлять фильтром <b>ROI</b>.');
    }

    setTimeout(renderStep, 500);
})();