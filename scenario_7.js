// --- ДВИЖОК ОБУЧАЮЩИХ СЦЕНАРИЕВ: СЦЕНАРИЙ №7 (РЕЖИМЫ ОТОБРАЖЕНИЯ) ---
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
            max-width: 420px;
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
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 10px;
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
        if (!isClickAllowed(e)) { e.preventDefault(); e.stopPropagation(); }
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
        else if (currentPlacement === 'bottom-right') {
            tooltip.style.left = (window.innerWidth - tooltip.offsetWidth - 30) + 'px';
            tooltip.style.top = (window.innerHeight - tooltip.offsetHeight - 40) + 'px';
            tooltip.className = '';
        }
        else if (currentPlacement === 'center') {
            tooltip.style.left = (window.innerWidth / 2 - tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = (window.innerHeight / 2 - tooltip.offsetHeight / 2) + 'px';
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
            onEnter: () => {
                // Привязываем уникальные ID для кнопок нижней панели
                document.querySelectorAll('.sb-panel').forEach(b => {
                    const txt = b.innerText.trim();
                    if (txt === 'реальный') b.id = 'tut-btn-real';
                    if (txt === 'Ярлык') b.id = 'tut-btn-label';
                    if (txt === 'Таблица') b.id = 'tut-btn-table';
                });
            },
            targetSelector: '.panel-left .box.h-35',
            eventType: 'click',
            placement: 'right',
            text: 'Добро пожаловать в обучение!<br><br>В этом сценарии мы детально изучим 3 формата визуализации.<br><br>Чтобы начать — кликните по <span class="action-badge">ЛЮБОМУ</span> рулону в левой таблице.',
            validate: (e) => !!e.target.closest('#coil-tbody tr')
        },

        // --- 2. КЛИКИ ПО ДЕФЕКТАМ В РЕЖИМЕ "ЯРЛЫК" ---
        {
            delay: 1000,
            onEnter: () => { window.tutLabelClicks = 0; },
            targetSelector: '.workspace',
            eventType: 'click',
            placement: 'bottom-right',
            text: () => `По умолчанию активен графический режим <span class="action-badge">Ярлык</span>.<br><br><div class="purpose-text">В этом виде система собирает рядом стоящие дефекты в удобные бирки, предотвращая визуальную «кашу».</div><br>Кликните по <b>2 любым биркам</b> на карте.<br><br>Осталось кликнуть: <span class="action-badge">${2 - window.tutLabelClicks}</span>`,
            validate: (e) => {
                if (e.target.closest('.defect-lbl')) {
                    window.tutLabelClicks++;
                    tooltip.innerHTML = steps[currentStep].text();
                    if (window.tutLabelClicks >= 2) return true;
                }
                return false;
            }
        },

        // --- 3. ПЕРЕХОД В РЕЖИМ "РЕАЛЬНЫЙ" ---
        {
            delay: 500,
            targetSelector: '#tut-btn-real',
            eventType: 'click',
            placement: 'top',
            text: 'Здорово! Теперь давайте перейдем к точным габаритам.<br><br>Нажмите кнопку <span class="action-badge">реальный</span> в статус-баре внизу.',
            validate: (e) => {
                if (e.target.closest('#tut-btn-real')) {
                    // Важно: останавливаем конфликт логики нижней кнопки!
                    e.preventDefault();
                    e.stopPropagation();

                    const realToolBtn = document.getElementById('btn-view-real');
                    if (realToolBtn) realToolBtn.click();
                    return true;
                }
                return false;
            }
        },

        // --- 4. КЛИКИ ПО ДЕФЕКТАМ В РЕЖИМЕ "РЕАЛЬНЫЙ" ---
        {
            delay: 800,
            onEnter: () => { window.tutRealClicks = 0; },
            targetSelector: '.workspace',
            eventType: 'click',
            placement: 'bottom-right',
            text: () => `Режим <span class="action-badge">Реальный</span> активирован!<br><br><div class="purpose-text">Обратите внимание: дефекты больше не сгруппированы. Теперь они отображаются в своих <b>физических пропорциях</b>: длинные царапины стали цветными блоками, а мелкие точки — небольшими крестиками.</div><br>Кликните левой кнопкой мыши по <b>2 любым блокам или крестикам</b> прямо на полосе.<br><br>Осталось кликнуть: <span class="action-badge">${2 - window.tutRealClicks}</span>`,
            validate: (e) => {
                if (e.target.closest('.defect-real-block') || e.target.closest('.defect-real-cross')) {
                    window.tutRealClicks++;
                    tooltip.innerHTML = steps[currentStep].text();
                    if (window.tutRealClicks >= 2) return true;
                }
                return false;
            }
        },

        // --- 5. ПЕРЕХОД В РЕЖИМ "ТАБЛИЦА" ---
        {
            delay: 500,
            targetSelector: '#tut-btn-table',
            eventType: 'click',
            placement: 'top',
            text: 'Прекрасно! А что делать, если графический вид не нужен и требуется просто информационная сводка?<br><br>Нажмите кнопку <span class="action-badge">Таблица</span>.',
            validate: (e) => {
                if (e.target.closest('#tut-btn-table')) {
                    e.preventDefault();
                    e.stopPropagation();

                    const tableToolBtn = document.getElementById('btn-view-table');
                    if (tableToolBtn) tableToolBtn.click();
                    return true;
                }
                return false;
            }
        },

        // --- 6. КЛИКИ ПО СТРОКАМ В РЕЖИМЕ "ТАБЛИЦА" ---
        {
            delay: 800,
            onEnter: () => { window.tutTableClicks = 0; },
            targetSelector: '#table-view-panel',
            eventType: 'click',
            placement: 'bottom-right',
            text: () => `Режим <span class="action-badge">Таблица</span> активирован!<br><br><div class="purpose-text">Графическая карта теперь полностью скрыта. Вы просматриваете списочный реестр дефектов. При изменении фильтров справа, этот список будет автоматически уменьшаться.</div><br>Кликните левой кнопкой мыши по <b>2 любым строкам</b> внутри таблицы.<br><br>Осталось кликнуть: <span class="action-badge">${2 - window.tutTableClicks}</span>`,
            validate: (e) => {
                if (e.target.closest('#defects-tbody tr')) {
                    window.tutTableClicks++;
                    tooltip.innerHTML = steps[currentStep].text();
                    if (window.tutTableClicks >= 2) return true;
                }
                return false;
            }
        },

        // --- 7. ЗАВЕРШЕНИЕ: ВОЗВРАТ НА "ЯРЛЫК" ---
        {
            delay: 500,
            targetSelector: '#tut-btn-label',
            eventType: 'click',
            placement: 'top',
            text: 'Отлично! Для повседневного визуального осмотра графическая карта с бирками обычно остается самой эргономичной.<br><br>Вернитесь в исходное состояние, нажав кнопку <span class="action-badge">Ярлык</span>.',
            validate: (e) => {
                if(e.target.closest('#tut-btn-label')) {
                    e.preventDefault();
                    e.stopPropagation();

                    const labelToolBtn = document.getElementById('btn-view-label');
                    if (labelToolBtn) labelToolBtn.click();
                    return true;
                }
                return false;
            }
        }
    ];

    // ==========================================
    // ДВИЖОК ОТОБРАЖЕНИЯ ШАГОВ
    // ==========================================
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
                // Если validation вернула true, переключаем шаг
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

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 200000; display: flex; justify-content: center; align-items: center;';

        const win = document.createElement('div');
        win.style.cssText = 'background-color: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 6px; width: 450px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column;';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 12px 5px 12px;';
        header.innerHTML = `<span style="color: #000; font-size: 12px; font-family: Tahoma, sans-serif; font-weight: bold;">Уведомление системы</span><button style="background: transparent; border: none; font-size: 18px; color: #555; cursor: pointer; padding: 0; line-height: 10px;">×</button>`;

        const body = document.createElement('div');
        body.style.cssText = 'padding: 20px 25px; font-size: 13px; color: black; font-family: Tahoma, sans-serif; text-align: center; line-height: 1.5;';
        body.innerHTML = '<b>Сценарий #4 успешно завершен!</b><br><br>Теперь вы умеете переключаться между общим обзором (Ярлык), детальным позиционированием дефектов (Реальный) и табличными данными (Таблица).';

        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; justify-content: center; padding-bottom: 20px;';
        const btn = document.createElement('button');
        btn.innerText = 'Ok';
        btn.style.cssText = 'width: 75px; height: 24px; cursor: pointer; color: black; background: #f0f0f0; border-top: 1px solid white; border-left: 1px solid white; border-bottom: 2px solid #808080; border-right: 2px solid #808080; font-size: 12px; font-family: Tahoma, sans-serif; outline: none;';

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