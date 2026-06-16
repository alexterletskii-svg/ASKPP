// --- ИНИЦИАЛИЗАЦИЯ ДВИЖКА СЦЕНАРИЕВ ---
(function initScenarioEngine() {
    // 1. Добавляем стили для подсветок и тултипа
    const style = document.createElement('style');
    style.innerHTML = `
        .tutorial-target {
            position: relative !important;
            /* Красивая оранжевая рамка и свечение для выделения элемента */
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
            transition: opacity 0.3s; /* Убрал transition для top/left, чтобы при ресайзе не "плавало" с задержкой */
            line-height: 1.5;
        }
        #tutorial-tooltip::after {
            content: ''; position: absolute; border: 8px solid transparent;
        }
        #tutorial-tooltip.arrow-left::after {
            top: 50%; left: -16px; transform: translateY(-50%); border-right-color: #0056a4;
        }
        .tooltip-note {
            font-size: 11px;
            color: #b3d4f5;
            margin-top: 8px;
            display: block;
            line-height: 1.3;
        }
        /* Класс для яркого выделения того, ЧТО нужно сделать */
     .action-badge {
    font-weight: bold;
    font-size: 15px;
    color: #ffffff; /* или можешь поставить #ffd700, если хочешь сделать текст желтым */
}
    `;
    document.head.appendChild(style);

    // 2. Создаем сам тултип
    const tooltip = document.createElement('div');
    tooltip.id = 'tutorial-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    // ==========================================
    // УМНЫЙ БЛОКИРОВЩИК (Мышь + Клавиатура)
    // ==========================================
    let activeTarget = null;
    let currentPlacement = 'right';

    // Блокируем клики вне целевого элемента
    document.addEventListener('mousedown', function(e) {
        if (activeTarget && !activeTarget.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    document.addEventListener('click', function(e) {
        if (activeTarget && !activeTarget.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    // Блокируем нажатие Tab, чтобы фокус не улетал
    document.addEventListener('keydown', function(e) {
        if (activeTarget && e.key === 'Tab') {
            e.preventDefault();
            e.stopPropagation();
            activeTarget.focus();
        }
    }, true);

    // ==========================================
    // СКЛЕИВАЕМ ТУЛТИП С ЭЛЕМЕНТОМ ПРИ РЕСАЙЗЕ
    // ==========================================
    function updateTooltipPosition() {
        if (!activeTarget || tooltip.style.display === 'none') return;

        const rect = activeTarget.getBoundingClientRect();

        if (currentPlacement === 'right') {
            tooltip.style.left = (rect.right + 20) + 'px';
            tooltip.style.top = (rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2)) + 'px';
        }
    }

    window.addEventListener('resize', updateTooltipPosition);
    // ==========================================


    // ФУНКЦИЯ: Отрисовка кастомного системного алерта
    function showCustomAlert(message, onOk) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); z-index: 200000; display: flex; justify-content: center; align-items: center;';

        const win = document.createElement('div');
        win.style.cssText = 'background-color: #f0f0f0; border: 1px solid #a0a0a0; border-radius: 6px; width: 350px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column;';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 12px 5px 12px;';
        header.innerHTML = `
            <span style="color: #000; font-size: 12px; font-family: Tahoma, sans-serif; font-weight: bold;">Модуль симуляции завершен</span>
            <button id="tut-alert-close" style="background: transparent; border: none; font-size: 18px; color: #555; cursor: pointer; padding: 0; line-height: 10px;">×</button>
        `;

        const body = document.createElement('div');
        body.style.cssText = 'padding: 20px 25px; font-size: 13px; color: black; font-family: Tahoma, sans-serif; text-align: center; line-height: 1.5;';
        body.innerHTML = message;

        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; justify-content: center; padding-bottom: 20px;';

        const btn = document.createElement('button');
        btn.innerText = 'Ok';
        btn.style.cssText = 'width: 75px; height: 24px; cursor: pointer; color: black; background: #f0f0f0; border-top: 1px solid white; border-left: 1px solid white; border-bottom: 2px solid #808080; border-right: 2px solid #808080; font-size: 12px; font-family: Tahoma, sans-serif; outline: none;';

        btn.onmousedown = () => {
            btn.style.borderTop = '2px solid #808080'; btn.style.borderLeft = '2px solid #808080';
            btn.style.borderBottom = '1px solid white'; btn.style.borderRight = '1px solid white';
            btn.style.paddingTop = '1px'; btn.style.paddingLeft = '1px';
        };
        btn.onmouseup = () => {
            btn.style.borderTop = '1px solid white'; btn.style.borderLeft = '1px solid white';
            btn.style.borderBottom = '2px solid #808080'; btn.style.borderRight = '2px solid #808080';
            btn.style.paddingTop = '0'; btn.style.paddingLeft = '0';
        };

        const closeAlert = () => {
            overlay.remove();
            if (onOk) onOk();
        };

        btn.onclick = closeAlert;

        footer.appendChild(btn);
        win.appendChild(header);
        win.appendChild(body);
        win.appendChild(footer);
        overlay.appendChild(win);
        document.body.appendChild(overlay);

        document.getElementById('tut-alert-close').onclick = closeAlert;
    }

    // 3. Шаги первого образовательного сценария
    let currentStep = 0;
    let activeListener = null;

    const steps = [
        {
            targetSelector: '#init-select',
            eventType: 'change',
            placement: 'right',
            text: '<b>Добро пожаловать в симулятор!</b><br><br>' +
                  'Наш терминал работает с базами данных разных агрегатов. В этом списке представлены:<br>' +
                  '• <b>DQS_CAL2</b> — АЭИП 2<br>' +
                  '• <b>DQS_CAL4</b> — АЭИП 4<br>' +
                  '• <b>DQS_CAL6</b> — АЭИП 6<br>' +
                  '• <b>ANO7</b> — АНО 7<br>' +
                  '<span class="tooltip-note"><i>* АЭИП — агрегат электроизоляционного покрытия<br>* АНО — агрегат непрерывного обжига</i></span><br>' +
                  'Для начала работы раскройте список и выберите систему:<br><span class="action-badge">DQS_CAL6</span>',
            validate: (e) => e.target.value === 'DQS_CAL6'
        },
        {
            targetSelector: '#init-username',
            eventType: 'input',
            placement: 'right',
            text: 'Отлично! Теперь необходимо пройти авторизацию.<br><br>Введите логин администратора:<br><span class="action-badge">Admin</span>',
            validate: (e) => e.target.value === 'Admin'
        },
        {
            targetSelector: '#init-password',
            eventType: 'input',
            placement: 'right',
            text: 'Логин принят. Введите пароль доступа:<br><span class="action-badge">Admin</span>',
            validate: (e) => e.target.value === 'Admin'
        },
        {
            targetSelector: '#initial-screen button',
            eventType: 'click',
            placement: 'right',
            text: 'Все данные введены верно.<br><br>Нажмите кнопку <span class="action-badge">Ok</span>, чтобы загрузить выбранную базу данных и войти в систему.',
            validate: () => true
        }
    ];

    // Функция отрисовки текущего шага
    function renderStep() {
        if (currentStep >= steps.length) {
            finishScenario();
            return;
        }

        const step = steps[currentStep];
        const targetEl = document.querySelector(step.targetSelector);

        if (!targetEl) {
            console.error(`Сбой сценария: Не найден элемент ${step.targetSelector}`);
            return;
        }

        // Подсвечиваем элемент
        targetEl.classList.add('tutorial-target');
        activeTarget = targetEl;
        currentPlacement = step.placement;

        // Вставляем текст
        tooltip.innerHTML = step.text;
        tooltip.style.display = 'block';
        tooltip.className = 'arrow-left'; // Здесь можно прописать динамику, если появятся другие направления

        // Позиционируем
        updateTooltipPosition();

        // Фокусируемся на элементе
        targetEl.focus();

        // Очищаем инпуты перед началом шага
        if (step.targetSelector === '#init-username' || step.targetSelector === '#init-password') {
            targetEl.value = '';
        }

        // Слушаем действие пользователя
        activeListener = function(e) {
            if (step.validate(e)) {
                targetEl.removeEventListener(step.eventType, activeListener);
                targetEl.classList.remove('tutorial-target');
                currentStep++;
                renderStep();
            }
        };

        targetEl.addEventListener(step.eventType, activeListener);
    }

    function finishScenario() {
        tooltip.style.display = 'none';
        activeTarget = null; // Отключаем защиту

        // Ждем окончание анимации и выдаем кастомный алерт
        setTimeout(() => {
            showCustomAlert('<b>Сценарий #1 успешно завершен!</b><br><br>Вы ознакомились с агрегатами и авторизовались в системе DQS_CAL6.');
        }, 1500);
    }

    // Запуск с задержкой 0.5с
    setTimeout(renderStep, 500);

})();