# import os
# from pathlib import Path
#
#
# def scan_and_write_paths(root_folder, output_file="file_paths.txt"):
#     """
#     Обходит все папки и подпапки, записывая пути файлов в выходной файл.
#
#     Args:
#         root_folder: Корневая папка для сканирования
#         output_file: Имя файла для вывода путей
#     """
#     # Преобразуем в абсолютный путь
#     root_path = Path(root_folder).resolve()
#
#     # Проверяем существование папки
#     if not root_path.exists():
#         print(f"Ошибка: Папка '{root_folder}' не найдена!")
#         return
#
#     if not root_path.is_dir():
#         print(f"Ошибка: '{root_folder}' не является папкой!")
#         return
#
#     # Список для хранения всех путей
#     all_paths = []
#
#     # Обходим все папки и файлы
#     for dirpath, dirnames, filenames in os.walk(root_path):
#         for filename in filenames:
#             # Полный путь к файлу
#             full_path = Path(dirpath) / filename
#
#             # Относительный путь от корневой папки
#             relative_path = full_path.relative_to(root_path)
#
#             # Форматируем путь с разделителями "/"
#             formatted_path = "/" + str(relative_path).replace("\\", "/")
#
#             all_paths.append(formatted_path)
#
#     # Сортируем пути для удобства
#     all_paths.sort()
#
#     # Записываем в файл
#     with open(output_file, "w", encoding="utf-8") as f:
#         for path in all_paths:
#             f.write(path + "\n")
#
#     print(f"Найдено {len(all_paths)} файлов.")
#     print(f"Результат сохранен в файл: {output_file}")
#
#
# if __name__ == "__main__":
#     # Указываем ваш путь
#     root_folder = r"D:\Тренажер АСКПП\АЭИП-ы\АЭИП-ы"
#
#     # Проверяем существование папки
#     if not os.path.exists(root_folder):
#         print(f"Ошибка: Папка '{root_folder}' не найдена!")
#         print("Пожалуйста, проверьте правильность пути.")
#         exit(1)
#
#     # Запускаем сканирование
#     scan_and_write_paths(root_folder)


# Создай файл convert_paths.py и положи рядом с file_paths.txt
input_file = "file_paths.txt"  # Твой файл с путями
output_file = "massiv bez roi.txt"  # Файл для вставки в HTML

with open(input_file, "r", encoding="utf-8") as f:
    paths = [line.strip() for line in f if line.strip()]

# Форматируем как JavaScript массив
with open(output_file, "w", encoding="utf-8") as f:
    f.write("const allFilePaths = [\n")
    for i, path in enumerate(paths):
        # Экранируем кавычки если есть
        escaped_path = path.replace('"', '\\"')
        comma = "," if i < len(paths) - 1 else ""
        f.write(f'    "{escaped_path}"{comma}\n')
    f.write("];\n")

print(f"Готово! Скопируй содержимое {output_file} в свой HTML")