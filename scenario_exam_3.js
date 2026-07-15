/**
 * Сценарий проверки: Экзамен 3 (Режим "Большой", пролистывание и ROI)
 * Файл: scenario_exam_3.js
 */
(function () {
    const SYSTEMS = ['DQS_CAL2', 'DQS_CAL4', 'DQS_CAL6'];
    const targetSystem = SYSTEMS[Math.floor(Math.random() * SYSTEMS.length)];

    let targetCoil = null;
    let currentStep = 0;

    // Переменные для новых шагов
    let defectsNavigated = 0;
    let roiToggled = false;

    // ==========================================
    // 🌐 ИНТЕГРАЦИЯ С WEBSOFT (WEBTUTOR / SCORM)
    // ==========================================
    function sendCourseCompletedToWebSoft() {
        var scorm = null;
        try {
            scorm = (window.parent && window.parent.pipwerks) ? window.parent.pipwerks.SCORM :
                    ((window.top && window.top.pipwerks) ? window.top.pipwerks.SCORM : null);
        } catch (e) { return; }

        if (scorm) {
            try {
                if (scorm.version === "2004") {
                    scorm.set("cmi.completion_status", "completed");
                    scorm.set("cmi.success_status", "passed");
                    scorm.set("cmi.score.raw", "100");
                } else {
                    scorm.set("cmi.core.lesson_status", "passed");
                    scorm.set("cmi.core.score.raw", "100");
                }
                scorm.commit(); scorm.quit();
                window._courseCompleted = true;
            } catch (e) {}
        }
    }

    function showCustomAlert(message) {
        const existing = document.getElementById('custom-exam-alert');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'custom-exam-alert';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; align-items: center; justify-content: center;';

        const box = document.createElement('div');
        box.style.cssText = 'background: #f0f0f0; padding: 20px 25px; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-align: center; font-family: Tahoma, sans-serif; min-width: 280px; border: 1px solid #a0a0a0; border-top: 4px solid #3d6a9d;';
        box.innerHTML = `<div style="margin-bottom: 20px; font-size: 12px; color: #000; line-height: 1.5;">${message}</div><button id="custom-alert-ok" style="width: 75px; height: 24px; cursor: pointer; color: black; background: #f0f0f0; border: 1px solid #808080; font-size: 12px;">ОК</button>`;

        overlay.appendChild(box); document.body.appendChild(overlay);
        document.getElementById('custom-alert-ok').onclick = () => overlay.remove();
    }

    function setupLoginInterceptor() {
        const originalSubmit = window.submitInitialSelection;
        if (typeof originalSubmit !== 'function') { setTimeout(setupLoginInterceptor, 200); return; }

        window.submitInitialSelection = function() {
            const user = document.getElementById('init-username').value.trim();
            const pass = document.getElementById('init-password').value.trim();
            const sys = document.getElementById('init-select').value;

            if (sys !== targetSystem) { showCustomAlert(`<b>Ошибка!</b><br>По заданию нужен агрегат: <b style="color:#d9534f;">${targetSystem}</b>`); return; }
            if (user !== 'Admin' || pass !== 'Admin') { showCustomAlert(`<b>Ошибка авторизации!</b><br>Используйте: <b>Admin / Admin</b>`); return; }
            originalSubmit();
        };
    }

    function initExamUI() {
        const style = document.createElement('style');
        style.innerHTML = `
            #exam-panel { position: fixed; bottom: 30px; right: 30px; width: 330px; background-color: #f0f4f9; border: 2px solid #808080; border-top-color: #fff; border-left-color: #fff; box-shadow: 2px 2px 10px rgba(0,0,0,0.5); z-index: 10000; font-family: Tahoma, sans-serif; font-size: 11px; color: #000; }
            #exam-header { background-color: #3d6a9d; color: white; font-weight: bold; padding: 4px 8px; }
            #exam-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
            .exam-task { display: flex; align-items: flex-start; gap: 6px; }
            .exam-task-checkbox { width: 14px; height: 14px; background: white; border: 1px solid #808080; border-bottom-color: #fff; border-right-color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; color: green; flex-shrink: 0; }
            .exam-task.done .exam-task-checkbox::after { content: '✔'; font-size: 10px; }
            .exam-task.done .exam-task-text { color: #555; text-decoration: line-through; }
            .highlight { background-color: #ffffcc; padding: 0 3px; border: 1px dotted #cccc00; }
            #exam-congratulations { display: none; margin-top: 10px; padding: 5px; background-color: #d4f0d4; border: 1px solid #5cb85c; text-align: center; font-weight: bold; color: #006600; }

            /* Принудительное скрытие рамки ROI для экзамена, если кнопка не сработала */
            body.exam-hide-roi #defect-image-box div[style*="border"],
            body.exam-hide-roi #defect-image-box .defect-roi,
            body.exam-hide-roi #defect-image-box .roi-box {
                display: none !important;
                opacity: 0 !important;
            }
        `;
        document.head.appendChild(style);

        const examPanel = document.createElement('div');
        examPanel.id = 'exam-panel';
        examPanel.innerHTML = `
            <div id="exam-header">Режим тестирования: Билет №3</div>
            <div id="exam-body">
                <div class="exam-task" id="task-0"><div class="exam-task-checkbox"></div><div class="exam-task-text"><b>Шаг 1:</b> Войдите в <b>${targetSystem}</b></div></div>
                <div class="exam-task" id="task-1" style="display: none;"><div class="exam-task-checkbox"></div><div class="exam-task-text" id="task-1-text"><b>Шаг 2:</b> Загрузите рулон <b>...</b></div></div>
                <div class="exam-task" id="task-2" style="display: none;"><div class="exam-task-checkbox"></div><div class="exam-task-text"><b>Шаг 3:</b> Перейдите в режим "Большой" (кнопка внизу)</div></div>
                <div class="exam-task" id="task-3" style="display: none;"><div class="exam-task-checkbox"></div><div class="exam-task-text" id="task-3-text"><b>Шаг 4:</b> Пролистайте дефекты (стрелки ВВЕРХ/ВНИЗ): <b>0/3</b></div></div>
                <div class="exam-task" id="task-4" style="display: none;"><div class="exam-task-checkbox"></div><div class="exam-task-text"><b>Шаг 5:</b> Переключите видимость ROI (кнопка внизу или Shift)</div></div>
                <div id="exam-congratulations">Проверка завершена успешно!</div>
            </div>
        `;
        document.body.appendChild(examPanel);

        const initScreen = document.getElementById('initial-screen');
        if(initScreen) initScreen.classList.remove('hidden');

        // ==========================================
        // СЛУШАТЕЛИ ДЛЯ ШАГА 3 (ПРОЛИСТЫВАНИЕ) И 4 (ROI)
        // ==========================================
        document.addEventListener('keydown', (e) => {
            // Шаг 3: Листание
            if (currentStep === 3 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                defectsNavigated++;
                document.getElementById('task-3-text').innerHTML = `<b>Шаг 4:</b> Пролистайте дефекты (стрелки ВВЕРХ/ВНИЗ): <b>${defectsNavigated}/3</b>`;

                if (defectsNavigated >= 3) {
                    document.getElementById('task-3').classList.add('done');
                    document.getElementById('task-4').style.display = 'flex';
                    currentStep = 4;
                }
            }

            // Шаг 4: Нажатие Shift для ROI
            if (e.key === 'Shift') {
                if (currentStep === 4) roiToggled = true;
                // Принудительно гасим рамку для наглядности
                document.body.classList.toggle('exam-hide-roi');
            }
        });

        // Нажатие мышкой по кнопке ROI
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.sb-panel');
            if (btn && (btn.innerText.includes('Rol') || btn.innerText.includes('Roi') || btn.id === 'tut-btn-rol')) {
                if (currentStep === 4) roiToggled = true;
                document.body.classList.toggle('exam-hide-roi');
            }
        });
    }

    function checkProgress() {
        switch (currentStep) {
            case 0: // Шаг 0: Авторизация
                const headerDiv = document.querySelector('.os-header div:nth-child(2)');
                if (headerDiv && headerDiv.innerText.includes(targetSystem) && document.getElementById('initial-screen').classList.contains('hidden')) {
                    const rows = document.querySelectorAll('#coil-tbody tr');
                    if (rows.length > 0) {
                        targetCoil = rows[Math.floor(Math.random() * rows.length)].cells[1].innerText;
                        document.getElementById('task-1-text').innerHTML = `<b>Шаг 2:</b> Загрузите рулон № <span class="highlight"><b>${targetCoil}</b></span>`;
                        document.getElementById('task-0').classList.add('done');
                        document.getElementById('task-1').style.display = 'flex';
                        currentStep = 1;
                    }
                }
                break;
            case 1: // Шаг 1: Загрузка рулона
                const selectedRow = document.querySelector('#coil-tbody tr.selected');
                if (selectedRow && selectedRow.cells[1].innerText === targetCoil) {
                    document.getElementById('task-1').classList.add('done');
                    document.getElementById('task-2').style.display = 'flex';
                    currentStep = 2;
                }
                break;
            case 2: // Шаг 2: Режим БОЛЬШОЙ
                const imgBox = document.getElementById('defect-image-box');
                if (imgBox && imgBox.classList.contains('large-mode')) {
                    document.getElementById('task-2').classList.add('done');
                    document.getElementById('task-3').style.display = 'flex';
                    currentStep = 3;
                }
                break;
            case 3:
                // Шаг 3 (Листание) обрабатывается EventListener'ом выше, функция просто ждет перехода
                break;
            case 4: // Шаг 4: Переключение ROI
                if (roiToggled) {
                    document.getElementById('task-4').classList.add('done');
                    document.getElementById('exam-congratulations').style.display = 'block';
                    currentStep = 5;
                    sendCourseCompletedToWebSoft();
                }
                break;
        }
    }

    initExamUI();
    setupLoginInterceptor();
    setInterval(checkProgress, 500);
})();