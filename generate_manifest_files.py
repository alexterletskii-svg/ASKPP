import os

# Имя итогового файла (можно сразу генерировать .xml)
output_file = 'generated_imsmanifest.txt'

# Верхняя часть манифеста
xml_header = """<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.nlmk.isra_simulator" version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <organizations default="NLMK_DEV">
    <organization identifier="NLMK_DEV">
      <title>Обучающий комплекс. Тренажер для контроллеров.</title>
      <item identifier="ITEM1" identifierref="RESOURCE1">
        <title>Обучающий комплекс</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RESOURCE1" type="webcontent" adlcp:scormtype="sco" href="index.html">"""

# Нижняя часть манифеста
xml_footer = """    </resource>
  </resources>
</manifest>"""

with open(output_file, 'w', encoding='utf-8') as f:
    # 1. Записываем начало документа
    f.write(xml_header + "\n")

    # 2. Ищем и записываем все .html и .js файлы в корневой папке
    f.write("      <!-- Базовые системные файлы и модули -->\n")
    for file in os.listdir('.'):
        if os.path.isfile(file) and file.endswith(('.html', '.js')):
            f.write(f'      <file href="{file}" />\n')

    # 3. Ищем и записываем все картинки и видео из папок
    f.write("\n      <!-- Медиа-файлы (картинки и видео) -->\n")
    folders_to_scan = ['picture', 'video']
    for folder in folders_to_scan:
        if os.path.exists(folder):
            for root, dirs, files in os.walk(folder):
                for file in files:
                    file_path = os.path.join(root, file).replace('\\', '/')
                    f.write(f'      <file href="{file_path}" />\n')

    # 4. Записываем конец документа
    f.write(xml_footer)

print(f"Готово! Полный манифест сгенерирован и сохранен в файл: {output_file}")