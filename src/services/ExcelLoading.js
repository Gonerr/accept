import * as XLSX from 'xlsx';

/**
 * Извлекает ИНН из Excel файла
 * @param {File} file - Файл Excel
 * @returns {Promise<string[]>} - Массив ИНН
 */
export const extractInnFromExcel = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let innColumnIndex = -1;
    let innValues = [];

    // Поиск столбца с ИНН по заголовкам
    if (jsonData.length > 0) {
      const headers = jsonData[0];
      innColumnIndex = headers.findIndex(header => 
        header && typeof header === 'string' && 
        (header.toLowerCase().includes('инн') || 
         header.toLowerCase().includes('inn') ||
         header.toLowerCase().includes('идентификационный'))
      );
    }

    // Извлечение ИНН
    if (innColumnIndex !== -1) {
      // Из найденного столбца
      for (let i = 1; i < jsonData.length; i++) {
        if (jsonData[i] && jsonData[i][innColumnIndex]) {
          const innValue = String(jsonData[i][innColumnIndex]).replace(/\D/g, '');
          if (innValue.length === 10 || innValue.length === 12) {
            innValues.push(innValue);
          }
        }
      }
    } else {
      // Автоматический поиск по всем ячейкам
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (Array.isArray(row)) {
          for (let j = 0; j < row.length; j++) {
            if (row[j]) {
              const cellValue = String(row[j]).replace(/\D/g, '');
              if (cellValue.length === 10 || cellValue.length === 12) {
                innValues.push(cellValue);
                break; // Только одно ИНН на строку
              }
            }
          }
        }
      }
    }

    // Убираем дубликаты
    const uniqueInnValues = [...new Set(innValues)];
    return uniqueInnValues;
  } catch (error) {
    console.error('Ошибка при чтении Excel файла:', error);
    throw new Error('Ошибка при чтении файла. Убедитесь, что файл имеет правильный формат.');
  }
};

/**
 * Валидация ИНН
 * @param {string} inn - ИНН для проверки
 * @returns {boolean} - Валидность ИНН
 */
export const validateInn = (inn) => {
  const cleaned = inn.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 12;
};

/**
 * Очистка и форматирование текста с ИНН
 * @param {string} text - Текст с ИНН
 * @returns {string} - Отформатированный текст
 */
export const formatInnText = (text) => {
  return text
    .split(/[\n,;]/) // Разделяем по разделителям
    .map(item => item.replace(/\D/g, '')) // Оставляем только цифры
    .filter(item => item.length === 10 || item.length === 12) // Фильтруем по длине
    .filter((item, index, self) => self.indexOf(item) === index) // Убираем дубликаты
    .join('\n'); // Объединяем через перенос строки
};

/**
 * Извлечение ИНН из текста
 * @param {string} text - Текст с ИНН
 * @returns {string[]} - Массив ИНН
 */
export const extractInnFromText = (text) => {
  return formatInnText(text).split('\n').filter(Boolean);
};

/**
 * Чтение из буфера обмена
 * @returns {Promise<string>} - Текст из буфера
 */
export const readFromClipboard = async () => {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    } else {
      // Fallback для старых браузеров
      return await fallbackReadFromClipboard();
    }
  } catch (error) {
    console.error('Ошибка при чтении из буфера:', error);
    throw error;
  }
};

/**
 * Fallback метод для чтения из буфера (для старых браузеров)
 * @returns {Promise<string>}
 */
const fallbackReadFromClipboard = () => {
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.value = '';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('paste');
      if (successful) {
        resolve(textArea.value);
      } else {
        reject(new Error('Не удалось прочитать из буфера'));
      }
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textArea);
    }
  });
};