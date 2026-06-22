# ASKPP

Универсальная функция для отправки оценки
Скопируйте и сохраните себе этот шаблон. Когда будете делать логику проверки ответов в exam.html, просто вызовите эту функцию в самом конце.

Убедитесь, что в <head> файла экзамена (например, exam.html) тоже есть строка:
<script src="SCORM_API_wrapper.js"></script>

А вот сам код для JS файла экзамена:


/**
 * Функция отправки результатов в Websoft HCM
 * @param {number} score - Балл пользователя (от 0 до 100)
 * @param {number} passingScore - Проходной балл (по умолчанию 80)
**/
function sendExamResultToLMS(score, passingScore = 80) {
    // 1. Проверяем, есть ли соединение с LMS
    // Если его нет (открыли без Websoft), библиотеку нужно инициализировать для этого кадра
    if (typeof pipwerks !== 'undefined') {
        var isConnected = pipwerks.SCORM.connection.isActive || pipwerks.SCORM.init();
        
        if (isConnected) {
            // 2. Определяем сдал или не сдал
            var status = (score >= passingScore) ? "passed" : "failed";

            // 3. Передаем баллы (обязательно как строку)
            pipwerks.SCORM.set("cmi.core.score.raw", String(score));
            pipwerks.SCORM.set("cmi.core.score.min", "0");
            pipwerks.SCORM.set("cmi.core.score.max", "100");

            // 4. Передаем статус
            pipwerks.SCORM.set("cmi.core.lesson_status", status);

            // 5. Жестко сохраняем данные на сервере Websoft
            pipwerks.SCORM.save();

            console.log("Данные успешно улетели в СДО. Балл: " + score + ", Статус: " + status);
        } else {
            console.warn("LMS не найдена (запуск локально). Балл был бы: " + score);
        }
    }
}


Как это использовать на практике (пример)
Допустим, в вашем режиме «Экзамен» ученику нужно было найти 5 дефектов. Он нашел 4 из 5 правильно. Ваша внутренняя логика высчитала, что это 80% успеха.

Когда ученик нажимает кнопку «Завершить экзамен», вы делаете следующее:

function onFinishExamClick() {
    // Ваша логика подсчета...
    let totalTasks = 5;
    let correctAnswers = 4;
    
    // Считаем процент (от 0 до 100)
    let finalScore = Math.round((correctAnswers / totalTasks) * 100); 
    
    // Вызываем нашу функцию (передаем балл, и, например, проходной балл 75)
    sendExamResultToLMS(finalScore, 75);

    // Показываем ученику красивое окно
    if (finalScore >= 75) {
        alert("Поздравляем! Экзамен сдан. Ваш результат: " + finalScore + "%");
    } else {
        alert("Экзамен не сдан. Ваш результат: " + finalScore + "%. Попробуйте еще раз.");
    }
}



Если ваш экзамен очень длинный, и вы хотите, чтобы пользователь мог закрыть окно, а на следующий день продолжить с того же места (с того же дефекта или вопроса), в SCORM для этого существует переменная cmi.core.lesson_location.

Она работает как текстовая закладка.

Чтобы сохранить этап (например, человек дошел до 3-го задания):
pipwerks.SCORM.set("cmi.core.lesson_location", "step_3");
pipwerks.SCORM.save();



Чтобы прочитать этап при следующем входе в тренажер:
// Пишем это где-то на старте загрузки exam.html
var savedStep = pipwerks.SCORM.get("cmi.core.lesson_location");

if (savedStep === "step_3") {
    console.log("Пользователь ранее остановился на 3 шаге. Загружаем его...");
    // тут ваша функция перелистывания тренажера на 3-е задание
}

