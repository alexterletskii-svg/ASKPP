/**
 * Сценарий проверки: Экзамен 2 (Камеры и Режимы отображения)
 * Файл: scenario_exam_2.js
 */
(function () {
    const SYSTEMS = ['DQS_CAL2', 'DQS_CAL4', 'DQS_CAL6', 'ANO7'];
    const targetSystem = SYSTEMS[Math.floor(Math.random() * SYSTEMS.length)];

    let targetCoil = null;
    let targetCameras = [];
    let currentStep = 0;

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
                    scorm.set("cmi.score.raw", "20");
                } else {
                    scorm.set("cmi.core.lesson_status", "passed");
                    scorm.set("cmi.core.score.raw", "20");
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
        `;
        document.head.appendChild(style);

        const examPanel = document.createElement('div');
        examPanel.id = 'exam-panel';
        examPanel.innerHTML = `
            <div id="exam-header">Режим тестирования: Билет №2</div>
            <div id="exam-body">
                <div class="exam-task" id="task-0"><div class="exam-task-checkbox"></div><div class="exam-task-text"><b>Шаг 1:</b> Войдите в <b>${targetSystem}</b> (Admin / Admin)</div></div>
                <div class="exam-task" id="task-1" style="display: none;"><div class="exam-task-checkbox"></div><div class="exam-task-text" id="task-1-text"><b>Шаг 2:</b> Загрузите рулон <b>...</b></div></div>
                <div class="exam-task" id="task-2" style="display: none;"><div class="exam-task-checkbox"></div><div class="exam-task-text" id="task-2-text"><b>Шаг 3:</b> Оставьте включенными только камеры...</div></div>
                <div class="exam-task" id="task-3" style="display: none;"><div class="exam-task-checkbox"></div><div class="exam-task-text"><b>Шаг 4:</b> Переключитесь в режим отображения <b>"Реальный"</b></div></div>
                <div class="exam-task" id="task-4" style="display: none;"><div class="exam-task-checkbox"></div><div class="exam-task-text"><b>Шаг 5:</b> Переключитесь в режим <b>"Таблица"</b></div></div>
                <div id="exam-congratulations">Проверка завершена успешно!</div>
            </div>
        `;
        document.body.appendChild(examPanel);

        const initScreen = document.getElementById('initial-screen');
        if(initScreen) initScreen.classList.remove('hidden');
    }

    function checkProgress() {
        switch (currentStep) {
            case 0:
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
            case 1:
                const selectedRow = document.querySelector('#coil-tbody tr.selected');
                if (selectedRow && selectedRow.cells[1].innerText === targetCoil) {
                    setTimeout(() => {
                        const camBlocks = Array.from(document.querySelectorAll('#content-cameras .filter-block'));
                        if (camBlocks.length > 0) {
                            camBlocks.sort(() => 0.5 - Math.random());
                            targetCameras = camBlocks.slice(0, 2).map(b => b.innerText.trim());
                            document.getElementById('task-2-text').innerHTML = `<b>Шаг 3:</b> Выключите все камеры и оставьте <u>только</u>:<br>• <b>${targetCameras.join("</b><br>• <b>")}</b>`;
                            document.getElementById('task-1').classList.add('done');
                            document.getElementById('task-2').style.display = 'flex';
                            currentStep = 2;
                        }
                    }, 500);
                }
                break;
            case 2:
                const allCams = document.querySelectorAll('#content-cameras .filter-block');
                if(allCams.length > 0) {
                    let isCorrect = true;
                    let foundCount = 0;
                    allCams.forEach(block => {
                        const isActive = block.classList.contains('active');
                        const isTarget = targetCameras.includes(block.innerText.trim());
                        if (isTarget && isActive) foundCount++;
                        else if (!isTarget && isActive) isCorrect = false;
                        else if (isTarget && !isActive) isCorrect = false;
                    });
                    if (isCorrect && foundCount === targetCameras.length) {
                        document.getElementById('task-2').classList.add('done');
                        document.getElementById('task-3').style.display = 'flex';
                        currentStep = 3;
                    }
                }
                break;
            case 3:
                // Проверяем, есть ли на карте блоки реального размера или активна ли кнопка
                const hasRealBlocks = document.querySelector('.defect-real-block') || document.querySelector('.defect-real-cross');
                // Альтернативная проверка: ищем кнопку "реальный" и проверяем её состояние (зависит от вашей верстки)
                const isRealMode = hasRealBlocks || (document.getElementById('btn-view-real') && document.getElementById('btn-view-real').classList.contains('active'));

                if (isRealMode) {
                    document.getElementById('task-3').classList.add('done');
                    document.getElementById('task-4').style.display = 'flex';
                    currentStep = 4;
                }
                break;
            case 4:
                const tablePanel = document.getElementById('table-view-panel');
                if (tablePanel && tablePanel.style.display !== 'none' && tablePanel.offsetWidth > 0) {
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
