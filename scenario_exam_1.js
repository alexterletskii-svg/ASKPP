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

    // Множество для сохранения ID дефектов, которые уже были измерены
    const measuredDefects = new Set();
    const NEEDED_MEASUREMENTS = 2; // Сколько разных дефектов надо измерить

    // --- 1. СОЗДАНИЕ ИНТЕРФЕЙСА ЗАДАНИЙ (ПАНЕЛЬ ЭКЗАМЕНА) ---
    function initExamUI() {
        const style = document.createElement('style');
        style.innerHTML = `
            #exam-panel {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 330px;
                background-color: #f0f4f9;
                border-top: 1px solid #ffffff;
                border-left: 1px solid #ffffff;
                border-bottom: 2px solid #808080;
                border-right: 2px solid #808080;
                box-shadow: 2px 2px 10px rgba(0,0,0,0.5);
                z-index: 10000; /* Поверх всего */
                font-family: 'Tahoma', sans-serif;
                font-size: 11px;
                color: #000;
                display: flex;
                flex-direction: column;
            }
            #exam-header {
                background-color: #3d6a9d;
                color: white;
                font-weight: bold;
                padding: 4px 8px;
                display: flex;
                justify-content: space-between;
                cursor: default;
            }
            #exam-body {
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .exam-task {
                display: flex;
                align-items: flex-start;
                gap: 6px;
            }
            .exam-task-checkbox {
                width: 14px;
                height: 14px;
                border-top: 1px solid #808080;
                border-left: 1px solid #808080;
                border-bottom: 1px solid #ffffff;
                border-right: 1px solid #ffffff;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: green;
                flex-shrink: 0;
            }
            .exam-task.done .exam-task-checkbox::after {
                content: '✔';
                font-size: 10px;
            }
            .exam-task.done .exam-task-text {
                color: #555;
                text-decoration: line-through;
            }
            .exam-task-text {
                line-height: 1.3;
            }
            .highlight {
                background-color: #ffffcc;
                padding: 0 3px;
                border: 1px dotted #cccc00;
            }
            #exam-congratulations {
                display: none;
                margin-top: 10px;
                padding: 5px;
                background-color: #d4f0d4;
                border: 1px solid #5cb85c;
                text-align: center;
                font-weight: bold;
                color: #006600;
            }
        `;
        document.head.appendChild(style);

        const examPanel = document.createElement('div');
        examPanel.id = 'exam-panel';
        examPanel.innerHTML = `
            <div id="exam-header">
                Режим тестирования: Билет №1
            </div>
            <div id="exam-body">
                <div class="exam-task" id="task-0">
                    <div class="exam-task-checkbox"></div>
                    <div class="exam-task-text"><b>Шаг 1:</b> Войдите в систему <b>${targetSystem}</b> (УЗ: Admin / Пароль: Admin)</div>
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
                    <div class="exam-task-text" id="task-4-text"><b>Шаг 5:</b> Зажмите <b>Ctrl</b> и измерьте линейкой <b>${NEEDED_MEASUREMENTS} разных дефекта</b>. (Переключайтесь между дефектами на карте/в таблице или стрелками).<br>Измерено: <b>0/${NEEDED_MEASUREMENTS}</b></div>
                </div>

                <div id="exam-congratulations">
                    Проверка завершена успешно!<br>Все навыки подтверждены.
                </div>
            </div>
        `;
        document.body.appendChild(examPanel);
    }

    // --- 2. ЛОГИКА ПРОВЕРКИ ---
    function checkProgress() {
        switch (currentStep) {
            case 0:
                // Шаг 1: Ожидание авторизации в нужной системе
                const headerDiv = document.querySelector('.os-header div:nth-child(2)');
                const initScreen = document.getElementById('initial-screen');

                if (headerDiv && headerDiv.innerText.includes(targetSystem) && initScreen && initScreen.classList.contains('hidden')) {
                    const rows = document.querySelectorAll('#coil-tbody tr');
                    if (rows.length > 0) {
                        // Выбираем случайный рулон
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
                // Шаг 2: Ожидание выбора назначенного рулона
                const selectedRow = document.querySelector('#coil-tbody tr.selected');
                if (selectedRow && selectedRow.cells[1].innerText === targetCoil) {

                    // Ждем 500мс для рендера фильтров
                    setTimeout(() => {
                        // Собираем классы, у которых есть дефекты (Счетчик вида 0/ 5)
                        const filterBlocks = Array.from(document.querySelectorAll('#content-classes .filter-block'));
                        const availableBlocks = filterBlocks.filter(block => {
                            const countText = block.querySelector('.fb-count').innerText;
                            const total = parseInt(countText.split('/')[1].trim());
                            return total > 0;
                        });

                        // Перемешиваем массив и берем 2 или 3 класса
                        availableBlocks.sort(() => 0.5 - Math.random());
                        const classesToSelect = Math.min(availableBlocks.length, Math.floor(Math.random() * 2) + 2); // 2 или 3

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
                // Шаг 3: Ожидание правильной комбинации фильтров классов
                const allBlocks = document.querySelectorAll('#content-classes .filter-block');
                if(allBlocks.length > 0) {
                    let isCorrect = true;
                    let targetFoundCount = 0;

                    allBlocks.forEach(block => {
                        const isActive = block.classList.contains('active') || block.classList.contains('yellow');
                        const isTarget = targetClasses.includes(block.dataset.value);

                        if (isTarget && isActive) {
                            targetFoundCount++;
                        } else if (!isTarget && isActive) {
                            // Включен "лишний" класс
                            isCorrect = false;
                        } else if (isTarget && !isActive) {
                            // Нужный класс еще не включен
                            isCorrect = false;
                        }
                    });

                    // Все нужные найдены, чужих и отключенных нет
                    if (isCorrect && targetFoundCount === targetClasses.length) {
                        document.getElementById('task-2').classList.add('done');
                        document.getElementById('task-3').style.display = 'flex';
                        currentStep = 3;
                    }
                }
                break;

            case 3:
                // Шаг 4: Переход в большой режим (Нижняя панель -> Большой)
                const imgBox = document.getElementById('defect-image-box');
                if (imgBox && imgBox.classList.contains('large-mode')) {
                    document.getElementById('task-3').classList.add('done');
                    document.getElementById('task-4').style.display = 'flex';
                    currentStep = 4;
                }
                break;

            case 4:
                // Шаг 5: Использование линейки на НЕСКОЛЬКИХ разных дефектах
                const ruler = document.querySelector('.img-ruler-line');

                // Если линейка растянута пользователем хотя бы на 5 пикселей
                if (ruler && parseFloat(ruler.style.width) > 5) {

                    // Узнаем, какой дефект сейчас открыт
                    const activeDefectRow = document.querySelector('#defects-tbody tr.selected');
                    if (activeDefectRow) {
                        const defectId = activeDefectRow.dataset.defectId;

                        // Если этот дефект мы еще не измеряли
                        if (!measuredDefects.has(defectId)) {
                            measuredDefects.add(defectId);

                            // Обновляем текст прогресса
                            document.getElementById('task-4-text').innerHTML = `<b>Шаг 5:</b> Зажмите <b>Ctrl</b> и измерьте линейкой <b>${NEEDED_MEASUREMENTS} разных дефекта</b>. (Переключайтесь между дефектами на карте/в таблице или стрелками).<br>Измерено: <b>${measuredDefects.size}/${NEEDED_MEASUREMENTS}</b>`;
                        }
                    }
                }

                // Завершение задачи, если измерено нужное количество
                if (measuredDefects.size >= NEEDED_MEASUREMENTS) {
                    document.getElementById('task-4').classList.add('done');
                    document.getElementById('exam-congratulations').style.display = 'block';
                    currentStep = 5;
                }
                break;
        }
    }

    // Запускаем инициализацию и цикл проверки
    initExamUI();
    setInterval(checkProgress, 500);

})();