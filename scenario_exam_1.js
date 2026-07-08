/**
 * Сценарий проверки: Оценка базовых навыков (Экзамен 1)
 * Файл: scenario_exam_1.js
 */

(function () {
    // Возможные системы для случайного выбора
    const SYSTEMS = ['DQS_CAL2', 'DQS_CAL4', 'DQS_CAL6', 'ANO7'];
    const targetSystem = SYSTEMS[Math.floor(Math.random() * SYSTEMS.length)];

    let targetCoil = null;
    let targetClasses = [];
    let currentStep = 0;

    const measuredDefects = new Set();
    const NEEDED_MEASUREMENTS = 2;

    // ==========================================
    // 🌐 ИНТЕГРАЦИЯ С WEBSOFT (WEBTUTOR / SCORM)
    // ==========================================
    function sendCourseCompletedToWebSoft() {
        var scorm = null;
        try {
            if (window.parent && window.parent.pipwerks) {
                scorm = window.parent.pipwerks.SCORM;
            } else if (window.top && window.top.pipwerks) {
                scorm = window.top.pipwerks.SCORM;
            }
        } catch (e) {
            console.error("Доступ к родительскому окну запрещён:", e);
            return;
        }

        if (!scorm) {
            console.warn("⚠️ pipwerks не найден. Возможно, курс запущен вне LMS.");
            return;
        }

        try {
            if (scorm.version === "2004") {
                scorm.set("cmi.completion_status", "completed");
                scorm.set("cmi.success_status", "passed");
                scorm.set("cmi.score.raw", "20");
            } else {
                scorm.set("cmi.core.lesson_status", "passed");
                scorm.set("cmi.core.score.raw", "20");
            }
            scorm.commit();
            scorm.quit();
            console.log("✅ Данные отправлены в LMS, сессия завершена.");
            window._courseCompleted = true;
        } catch (e) {
            console.error("❌ Ошибка при отправке данных в LMS:", e);
        }
    }

    // ==========================================
    // 🛑 КАСТОМНЫЕ УВЕДОМЛЕНИЯ И ПЕРЕХВАТ ВХОДА
    // ==========================================

    function showCustomAlert(message) {
        const existing = document.getElementById('custom-exam-alert');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'custom-exam-alert';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.6); z-index: 100000;
            display: flex; align-items: center; justify-content: center;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: #f0f0f0; padding: 20px 25px; border-radius: 6px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-align: center;
            font-family: 'Tahoma', sans-serif; min-width: 280px;
            border: 1px solid #a0a0a0; border-top: 4px solid #3d6a9d;
        `;

        box.innerHTML = `
            <div style="margin-bottom: 20px; font-size: 12px; color: #000; line-height: 1.5;">${message}</div>
            <button id="custom-alert-ok" style="width: 75px; height: 24px; cursor: pointer; color: black; background: #f0f0f0; border-top: 1px solid white; border-left: 1px solid white; border-bottom: 2px solid #808080; border-right: 2px solid #808080; font-size: 12px;">ОК</button>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const btn = document.getElementById('custom-alert-ok');
        btn.onclick = () => overlay.remove();
        btn.onmousedown = () => { btn.style.borderTop='2px solid #808080'; btn.style.borderLeft='2px solid #808080'; btn.style.borderBottom='1px solid white'; btn.style.borderRight='1px solid white'; };
        btn.onmouseup = () => { btn.style.borderTop='1px solid white'; btn.style.borderLeft='1px solid white'; btn.style.borderBottom='2px solid #808080'; btn.style.borderRight='2px solid #808080'; };
    }

    // Переопределяем оригинальную функцию входа из вашего HTML
    function setupLoginInterceptor() {
        // Сохраняем оригинальную функцию, чтобы вызвать её, если всё верно
        const originalSubmit = window.submitInitialSelection;

        if (typeof originalSubmit !== 'function') {
            setTimeout(setupLoginInterceptor, 200);
            return;
        }

        window.submitInitialSelection = function() {
            const user = document.getElementById('init-username').value.trim();
            const pass = document.getElementById('init-password').value.trim();
            const sys = document.getElementById('init-select').value;

            // 1. Проверка агрегата
            if (sys !== targetSystem) {
                showCustomAlert(`<b>Ошибка выбора агрегата!</b><br><br>Вы выбрали неверную систему.<br>По заданию вам нужен: <b style="color:#d9534f;">${targetSystem}</b>`);
                return; // Блокируем вход
            }

            // 2. Проверка логина/пароля
            if (user !== 'Admin' || pass !== 'Admin') {
                showCustomAlert(`<b>Ошибка авторизации!</b><br><br>Неверный логин или пароль.<br>Используйте учетную запись: <b>Admin / Admin</b>`);

                // Очищаем пароль для удобства
                const passInput = document.getElementById('init-password');
                passInput.value = '';
                passInput.focus();
                return; // Блокируем вход
            }

            // Если всё верно — запускаем оригинальную логику загрузки
            originalSubmit();
        };
    }

    // --- 1. СОЗДАНИЕ ИНТЕРФЕЙСА ЗАДАНИЙ (ПАНЕЛЬ ЭКЗАМЕНА) ---
    function initExamUI() {
        const style = document.createElement('style');
        style.innerHTML = `
            #exam-panel {
                position: fixed; bottom: 30px; right: 30px; width: 330px;
                background-color: #f0f4f9; border-top: 1px solid #ffffff; border-left: 1px solid #ffffff;
                border-bottom: 2px solid #808080; border-right: 2px solid #808080;
                box-shadow: 2px 2px 10px rgba(0,0,0,0.5); z-index: 10000;
                font-family: 'Tahoma', sans-serif; font-size: 11px; color: #000;
                display: flex; flex-direction: column;
            }
            #exam-header {
                background-color: #3d6a9d; color: white; font-weight: bold;
                padding: 4px 8px; display: flex; justify-content: space-between; cursor: default;
            }
            #exam-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
            .exam-task { display: flex; align-items: flex-start; gap: 6px; }
            .exam-task-checkbox {
                width: 14px; height: 14px; background: white;
                border-top: 1px solid #808080; border-left: 1px solid #808080;
                border-bottom: 1px solid #ffffff; border-right: 1px solid #ffffff;
                display: flex; align-items: center; justify-content: center;
                font-weight: bold; color: green; flex-shrink: 0;
            }
            .exam-task.done .exam-task-checkbox::after { content: '✔'; font-size: 10px; }
            .exam-task.done .exam-task-text { color: #555; text-decoration: line-through; }
            .exam-task-text { line-height: 1.3; }
            .highlight { background-color: #ffffcc; padding: 0 3px; border: 1px dotted #cccc00; }
            #exam-congratulations {
                display: none; margin-top: 10px; padding: 5px; background-color: #d4f0d4;
                border: 1px solid #5cb85c; text-align: center; font-weight: bold; color: #006600;
            }
        `;
        document.head.appendChild(style);

        const examPanel = document.createElement('div');
        examPanel.id = 'exam-panel';
        examPanel.innerHTML = `
            <div id="exam-header">Режим тестирования: Билет №1</div>
            <div id="exam-body">
                <div class="exam-task" id="task-0">
                    <div class="exam-task-checkbox"></div>
                    <div class="exam-task-text"><b>Шаг 1:</b> Войдите в систему <b>${targetSystem}</b> (Учетная запись: Admin / Пароль: Admin)</div>
                </div>
                <div class="exam-task" id="task-1" style="display: none;">
                    <div class="exam-task-checkbox"></div>
                    <div class="exam-task-text" id="task-1-text"><b>Шаг 2:</b> Найдите (через таблицу или поиск) и выберите рулон <b>...</b></div>
                </div>
                <div class="exam-task" id="task-2" style="display: none;">
                    <div class="exam-task-checkbox"></div>
                    <div class="exam-task-text" id="task-2-text"><b>Шаг 3:</b> Включите фильтры...</div>
                </div>
                <div class="exam-task" id="task-3" style="display: none;">
                    <div class="exam-task-checkbox"></div>
                    <div class="exam-task-text"><b>Шаг 4:</b> Перейдите в режим "Изображение дефекта: Большой"</div>
                </div>
                <div class="exam-task" id="task-4" style="display: none;">
                    <div class="exam-task-checkbox"></div>
                    <div class="exam-task-text" id="task-4-text"><b>Шаг 5:</b> Зажмите <b>Ctrl</b> и измерьте линейкой <b>${NEEDED_MEASUREMENTS} разных дефекта</b>.<br>Измерено: <b>0/${NEEDED_MEASUREMENTS}</b></div>
                </div>
                <div id="exam-congratulations">Проверка завершена успешно!<br>Все навыки подтверждены.</div>
            </div>
        `;
        document.body.appendChild(examPanel);

        // Принудительно показываем стартовый экран (запуск сначала)
        const initScreen = document.getElementById('initial-screen');
        if(initScreen) initScreen.classList.remove('hidden');
    }

    // --- 2. ЛОГИКА ПРОВЕРКИ ---
    function checkProgress() {
        switch (currentStep) {
            case 0:
                const headerDiv = document.querySelector('.os-header div:nth-child(2)');
                const initScreen = document.getElementById('initial-screen');

                if (headerDiv && headerDiv.innerText.includes(targetSystem) && initScreen && initScreen.classList.contains('hidden')) {
                    const rows = document.querySelectorAll('#coil-tbody tr');
                    if (rows.length > 0) {
                        const randomRow = rows[Math.floor(Math.random() * rows.length)];
                        targetCoil = randomRow.cells[1].innerText;

                        document.getElementById('task-1-text').innerHTML = `<b>Шаг 2:</b> Найдите (в таблице или через лупу) и загрузите рулон № <span class="highlight"><b>${targetCoil}</b></span>`;
                        document.getElementById('task-0').classList.add('done');
                        document.getElementById('task-1').style.display = 'flex';
                        currentStep = 1;
                    }
                }
                break;

            case 1:
                const selectedRow = document.querySelector('#coil-tbody tr.selected');
                if (selectedRow && selectedRow.cells[1].innerText === targetCoil) {
                    setTimeout(() => {
                        const filterBlocks = Array.from(document.querySelectorAll('#content-classes .filter-block'));
                        const availableBlocks = filterBlocks.filter(block => {
                            const countText = block.querySelector('.fb-count').innerText;
                            const total = parseInt(countText.split('/')[1].trim());
                            return total > 0;
                        });

                        availableBlocks.sort(() => 0.5 - Math.random());
                        const classesToSelect = Math.min(availableBlocks.length, Math.floor(Math.random() * 2) + 2);

                        targetClasses = availableBlocks.slice(0, classesToSelect).map(b => b.dataset.value);
                        const classesStr = targetClasses.join("</b><br>• <b>");

                        document.getElementById('task-2-text').innerHTML = `<b>Шаг 3:</b> Выключите все дефекты и оставьте включенными <u>только</u> классы:<br>• <b>${classesStr}</b>`;

                        document.getElementById('task-1').classList.add('done');
                        document.getElementById('task-2').style.display = 'flex';
                        currentStep = 2;

                    }, 500);
                }
                break;

            case 2:
                const allBlocks = document.querySelectorAll('#content-classes .filter-block');
                if(allBlocks.length > 0) {
                    let isCorrect = true;
                    let targetFoundCount = 0;

                    allBlocks.forEach(block => {
                        const isActive = block.classList.contains('active') || block.classList.contains('yellow');
                        const isTarget = targetClasses.includes(block.dataset.value);

                        if (isTarget && isActive) targetFoundCount++;
                        else if (!isTarget && isActive) isCorrect = false;
                        else if (isTarget && !isActive) isCorrect = false;
                    });

                    if (isCorrect && targetFoundCount === targetClasses.length) {
                        document.getElementById('task-2').classList.add('done');
                        document.getElementById('task-3').style.display = 'flex';
                        currentStep = 3;
                    }
                }
                break;

            case 3:
                const imgBox = document.getElementById('defect-image-box');
                if (imgBox && imgBox.classList.contains('large-mode')) {
                    document.getElementById('task-3').classList.add('done');
                    document.getElementById('task-4').style.display = 'flex';
                    currentStep = 4;
                }
                break;

            case 4:
                const ruler = document.querySelector('.img-ruler-line');

                if (ruler && parseFloat(ruler.style.width) > 5) {
                    const activeDefectRow = document.querySelector('#defects-tbody tr.selected');
                    if (activeDefectRow) {
                        const defectId = activeDefectRow.dataset.defectId;

                        if (!measuredDefects.has(defectId)) {
                            measuredDefects.add(defectId);
                            document.getElementById('task-4-text').innerHTML = `<b>Шаг 5:</b> Зажмите <b>Ctrl</b> и измерьте линейкой <b>${NEEDED_MEASUREMENTS} разных дефекта</b>.<br>Измерено: <b>${measuredDefects.size}/${NEEDED_MEASUREMENTS}</b>`;
                        }
                    }
                }

                if (measuredDefects.size >= NEEDED_MEASUREMENTS) {
                    document.getElementById('task-4').classList.add('done');
                    document.getElementById('exam-congratulations').style.display = 'block';
                    currentStep = 5;
                    sendCourseCompletedToWebSoft();
                }
                break;
        }
    }

    // Запускаем инициализацию
    initExamUI();
    setupLoginInterceptor();
    setInterval(checkProgress, 500);

})();
