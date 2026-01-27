// services/ParserService.js
import axios from 'axios';
import * as XLSX from 'xlsx';
import { parse } from 'node-html-parser';

// URL прокси-сервера
const PROXY_URL = 'http://localhost:8080/';

export class ParserService {

    static parseINNList(inputString) {
        if (!inputString) return [];
        return inputString
            .split(/[,;\s\n]+/)
            .map(inn => inn.trim())
            .filter(inn => /^\d{10,12}$/.test(inn)); 
    }

    static async fetchOperatorId(inn) {
        // Используем прокси
        const targetUrl = `https://pd.rkn.gov.ru/operators-registry/operators-list/?act=search&name_full=&inn=${inn}&regn=`;
        const proxyUrl = `${PROXY_URL}${targetUrl}`;

        console.log(`Запрос через прокси: ${proxyUrl}`);

        try {
            const response = await axios.get(proxyUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            });

            if (!response.data) {
                throw new Error('Пустой ответ от сервера');
            }

            const html = response.data;
            const root = parse(html);

            const links = root.querySelectorAll('a[href*="?id="]');
            console.log(`Найдено ссылок: ${links.length}`);

            if (links.length > 0) {
                const href = links[0].getAttribute('href');
                const match = href.match(/\?id=([^&]+)/);
                if (match && match[1]) {
                    console.log(`Найден ID для ИНН ${inn}: ${match[1]}`);
                    return match[1];
                }
            }

            const rows = root.querySelectorAll('tr');
            for (const row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    const text = row.textContent || '';
                    if (text.includes(`ИНН: ${inn}`)) {
                        const link = row.querySelector('a[href*="?id="]');
                        if (link) {
                            const href = link.getAttribute('href');
                            const match = href.match(/\?id=([^&]+)/);
                            return match ? match[1] : null;
                        }
                    }
                }
            }

            return null;

        } catch (error) {
            console.error(`Ошибка при поиске ID для ИНН ${inn}:`, error.message);
            if (error.message.includes('CORS') || error.message.includes('Network Error')) {
                console.log('Пробуем альтернативный метод...');
                return await this.tryDirectFetch(inn);
            }

            throw error;
        }
    }

    // Альтернативный метод для тестирования
    static async tryDirectFetch(inn) {
        try {
            const response = await fetch(
                `https://cors-anywhere.herokuapp.com/https://pd.rkn.gov.ru/operators-registry/operators-list/?act=search&inn=${inn}`,
                {
                    mode: 'cors',
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            );

            if (response.ok) {
                const text = await response.text();
                const match = text.match(/\?id=([^&"]+)/);
                return match ? match[1] : null;
            }
        } catch (e) {
            console.error('Альтернативный метод тоже не сработал:', e.message);
        }
        return null;
    }

    static async fetchOperatorDetails(id) {
        const targetUrl = `https://pd.rkn.gov.ru/operators-registry/operators-list/?id=${id}`;
        const proxyUrl = `${PROXY_URL}${targetUrl}`;

        console.log(`Запрос деталей: ${proxyUrl}`);

        try {
            const response = await axios.get(proxyUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const html = response.data;
            const root = parse(html);

            const result = {
                'Регистрационный номер': id,
                'ИНН': '',
                'Наименование оператора': '',
                'Юридический адрес': '',
                'Дата регистрации': ''
            };

            // Парсим таблицу с деталями
            const rows = root.querySelectorAll('table tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const key = cells[0].text.trim()
                        .replace(/&nbsp;/g, ' ')
                        .replace(/\s+/g, ' ');

                    let value = cells[1].text.trim()
                        .replace(/&nbsp;/g, ' ')
                        .replace(/\s+/g, ' ');

                    if (key.includes('ИНН')) result['ИНН'] = value;
                    if (key.includes('Наименование')) result['Наименование оператора'] = value;
                    if (key.includes('Юридический адрес')) result['Юридический адрес'] = value;
                    if (key.includes('Дата регистрации')) result['Дата регистрации'] = value;
                    result[key] = value;
                }
            });

            return result;

        } catch (error) {
            console.error(`Ошибка при получении деталей для ID ${id}:`, error.message);
            throw error;
        }
    }

    static async startParsingProcess(innList, onProgress) {
        console.log('Начинаем парсинг для ИНН:', innList);

        if (!innList || innList.length === 0) {
            console.error('Список ИНН пуст');
            return [];
        }

        const allResults = [];

        for (let i = 0; i < innList.length; i++) {
            const inn = innList[i];
            console.log(`Обработка ${i + 1}/${innList.length}: ИНН ${inn}`);

            try {
                // Отправляем прогресс
                if (onProgress) {
                    onProgress({
                        inn,
                        step: 'Поиск ID',
                        status: 'start',
                        index: i,
                        total: innList.length,
                        message: `Поиск оператора для ИНН ${inn}...`
                    });
                }

                // Шаг 1: Получаем ID оператора
                const operatorId = await this.fetchOperatorId(inn);

                if (!operatorId) {
                    console.warn(`Оператор с ИНН ${inn} не найден`);

                    if (onProgress) {
                        onProgress({
                            inn,
                            step: 'Поиск ID',
                            status: 'error',
                            message: `Оператор с ИНН ${inn} не найден в реестре`
                        });
                    }

                    // Добавляем запись об ошибке
                    allResults.push({
                        'ИНН': inn,
                        'Статус': 'Не найден',
                        'Ошибка': 'Оператор не найден в реестре',
                        'Регистрационный номер': '',
                        'Наименование оператора': ''
                    });

                    continue;
                }

                // Успешно нашли ID
                if (onProgress) {
                    onProgress({
                        inn,
                        step: 'Поиск ID',
                        status: 'success',
                        id: operatorId,
                        message: `Найден ID: ${operatorId}`
                    });
                }

                // Задержка между запросами
                await new Promise(resolve => setTimeout(resolve, 500));

                // Шаг 2: Получаем детальную информацию
                if (onProgress) {
                    onProgress({
                        inn,
                        step: 'Получение деталей',
                        status: 'start',
                        id: operatorId,
                        message: 'Загрузка детальной информации...'
                    });
                }

                const details = await this.fetchOperatorDetails(operatorId);

                // Форматируем результат
                const result = {
                    'ИНН': inn,
                    'Регистрационный номер': details['Регистрационный номер'] || operatorId,
                    'Наименование оператора': details['Наименование оператора'] || '',
                    'Юридический адрес': details['Юридический адрес'] || '',
                    'Дата регистрации уведомления': details['Дата регистрации уведомления'] || '',
                    'Дата начала обработки': details['Дата начала обработки персональных данных'] || '',
                    'Дата прекращения обработки': details['Срок или условие прекращения обработки персональных данных'] || '',
                    'ФИО ответственного': details['ФИО физического лица или наименование юридического лица, ответственных за организацию обработки персональных данных'] || '',
                    'Контакты': details['номера их контактных телефонов, почтовые адреса и адреса электронной почты'] || '',
                    'Статус': 'Успешно',
                    'ID': operatorId
                };

                allResults.push(result);

                if (onProgress) {
                    onProgress({
                        inn,
                        step: 'Получение деталей',
                        status: 'success',
                        message: 'Данные успешно получены'
                    });
                }

            } catch (error) {
                console.error(`Критическая ошибка для ИНН ${inn}:`, error);

                if (onProgress) {
                    onProgress({
                        inn,
                        step: 'Ошибка',
                        status: 'error',
                        message: `Ошибка: ${error.message}`
                    });
                }

                allResults.push({
                    'ИНН': inn,
                    'Статус': 'Ошибка',
                    'Ошибка': error.message || 'Неизвестная ошибка',
                    'Регистрационный номер': '',
                    'Наименование оператора': ''
                });
            }
            if (onProgress) {
                const progressPercent = Math.round(((i + 1) / innList.length) * 100);
                onProgress({
                    step: 'Общий прогресс',
                    status: 'progress',
                    percent: progressPercent,
                    processed: i + 1,
                    total: innList.length,
                    message: `Обработано: ${i + 1} из ${innList.length}`
                });
            }
        }

        console.log('Парсинг завершен. Результатов:', allResults.length);
        return allResults;
    }

static exportToExcel(data, filename = 'roskomnadzor_data.xlsx') {
    if (!data || data.length === 0) {
        console.error('Нет данных для экспорта');
        return;
    }
    
    console.log('data данные для экспорта =', data);
    
    try {
        // Функция для парсинга телефонов
        const parsePhones = (contactsText) => {
            if (!contactsText) return [];
            
            let text = contactsText.toString().trim();
            const foundPhones = new Set();
            
            const phonePatterns = [
                /\b8\s?\(?\d{3}\)?\s?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g,
                /\b8[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g,
                /\b\+?7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g,
                /\b\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g,
                /\b\d{10,11}\b/g,
                /\b\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g,
                /\b\d[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}\b/g
            ];
            
            phonePatterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    matches.forEach(phone => {
                        let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
                        
                        if (cleanPhone.startsWith('8') && cleanPhone.length === 11) {
                            cleanPhone = '7' + cleanPhone.slice(1);
                        }
                        
                        if (cleanPhone.startsWith('7') && cleanPhone.length === 11) {
                            cleanPhone = '+7' + cleanPhone.slice(1);
                        } else if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
                            cleanPhone = '+7' + cleanPhone;
                        }
                        
                        if (cleanPhone.startsWith('+7') && cleanPhone.length === 12) {
                            const formatted = `+7-(${cleanPhone.slice(2, 5)})-${cleanPhone.slice(5, 8)}-${cleanPhone.slice(8, 10)}-${cleanPhone.slice(10)}`;
                            foundPhones.add(formatted);
                        }
                    });
                }
            });
            
            return Array.from(foundPhones);
        };

        // Функция для парсинга email
        const parseEmails = (contactsText) => {
            if (!contactsText) return [];
            
            const text = contactsText.toString();
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const matches = text.match(emailPattern);
            
            if (!matches) return [];
            const uniqueEmails = [...new Set(matches.map(email => email.toLowerCase().trim()))];
            return uniqueEmails.sort();
        };
        
        // Функция для очистки текста от телефонов и email
        const cleanTextFromContacts = (text, phones, emails) => {
            if (!text) return '';
            
            let cleaned = text.toString();
            
            // Удаляем телефоны
            phones.forEach(phone => {
                const cleanPhone = phone.replace(/[\(\)\-\+]/g, '').slice(1);
                cleaned = cleaned.replace(new RegExp(cleanPhone, 'gi'), '');
            });
            
            // Удаляем email
            emails.forEach(email => {
                const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                cleaned = cleaned.replace(new RegExp(escapedEmail, 'gi'), '');
            });
            
            // Очищаем лишние символы
            cleaned = cleaned
                .replace(/\s+/g, ' ')
                .replace(/[\,\;]+/g, ', ')
                .trim()
                .replace(/^[,\s]+|[,\s]+$/g, '')
                .replace(/\s*;\s*/g, '; ')
                .replace(/\s*,\s*/g, ', ');
            
            // Удаляем пустые сегменты
            const segments = cleaned.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
            return segments.join(', ');
        };
        
        // Функция для извлечения ФИО ответственного
        const extractResponsible = (contactsText) => {
            if (!contactsText) return '';
            
            const text = contactsText.toString();
            
            // Паттерны для поиска ФИО
            const fioPatterns = [
                /([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/,
                /([А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.[А-ЯЁ]\.)/,
                /([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)(?=\s|$)/,
                /(?:ФИО|ответственный|руководитель)[:\s]+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/i,
                /контактных данных[:\s]+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/i
            ];
            
            for (const pattern of fioPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }
            
            return '';
        };
        
        // Функция для извлечения адреса
        const extractAddress = (contactsText) => {
            if (!contactsText) return '';
            
            const text = contactsText.toString();
            
            // Ищем индексы (6 цифр)
            const indexMatch = text.match(/\b\d{6}\b/);
            if (indexMatch) {
                const indexPos = text.indexOf(indexMatch[0]);
                // Берем текст после индекса (примерно 100 символов)
                const addressPart = text.substring(indexPos, indexPos + 150);
                
                // Очищаем от email и телефонов
                let cleanedAddress = addressPart
                    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
                    .replace(/\b\d[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                return cleanedAddress;
            }
            
            return '';
        };
        
        // Преобразуем данные в формат для Excel
        const exportData = data.map(item => {
            // Получаем текст контактов
            const contactsText = item['Контакты'] || 
                               item['контактные телефоны'] || 
                               item['Контактная информация'] || 
                               item['номера их контактных телефонов, почтовые адреса и адреса электронной почты'] || '';
            
            // Парсим телефоны
            const phones = parsePhones(contactsText);
            
            // Парсим email
            const emails = parseEmails(contactsText);
            
            // Очищаем текст от контактов
            const otherContacts = cleanTextFromContacts(contactsText, phones, emails);
            
            // Ищем ФИО ответственного
            let responsibleFIO = item['ФИО ответственного'] || 
                                item['ФИО физического лица'] || 
                                item['ФИО физического лица или наименование юридического лица, ответственных за организацию обработки персональных данных'] ||
                                extractResponsible(contactsText) || '';
            
            // Если не нашли в специальном поле, ищем в общих контактах
            if (!responsibleFIO && contactsText) {
                responsibleFIO = extractResponsible(contactsText);
            }
            
            // Ищем адрес в контактах
            const contactAddress = extractAddress(contactsText);
            
            // Формируем строки
            const phonesString = phones.length > 0 ? phones.join('; ') : '';
            const emailsString = emails.length > 0 ? emails.join('; ') : '';
            
            return {
                'ИНН': item['ИНН'] || '',
                'Регистрационный номер': item['Регистрационный номер'] || item['ID'] || '',
                'Наименование оператора': item['Наименование оператора'] || '',
                'Юридический адрес': item['Юридический адрес'] || item['Адрес'] || contactAddress || '',
                'Дата регистрации': item['Дата регистрации уведомления'] || item['Дата регистрации'] || '',
                'ФИО ответственного': responsibleFIO,
                'Контактный телефон': phonesString,
                'Email': emailsString, // Новая колонка
                'Прочие контакты': otherContacts,
                'Статус': item['Статус'] || ''
            };
        });
        
        // Создаем заголовки с правильной шириной
        const headers = [
            { key: 'ИНН', width: 15 },
            { key: 'Регистрационный номер', width: 20 },
            { key: 'Наименование оператора', width: 40 },
            { key: 'Юридический адрес', width: 50 },
            { key: 'Дата регистрации', width: 15 },
            { key: 'ФИО ответственного', width: 25 },
            { key: 'Контактный телефон', width: 30 },
            { key: 'Email', width: 30 }, // Новая колонка
            { key: 'Прочие контакты', width: 40 },
            { key: 'Статус', width: 15 }
        ];
        
        // Преобразуем в формат для XLSX
        const worksheetData = exportData.map(row => {
            const obj = {};
            headers.forEach(header => {
                obj[header.key] = row[header.key] || '';
            });
            return obj;
        });
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        
        // Настраиваем ширину колонок
        const wscols = headers.map(h => ({ width: h.width }));
        worksheet['!cols'] = wscols;
        
        // Добавляем автофильтр
        if (worksheet['!ref']) {
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({
                s: { r: 0, c: 0 },
                e: { r: range.e.r, c: headers.length - 1 }
            }) };
        }
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Операторы');
        
        // Сохраняем файл
        XLSX.writeFile(workbook, filename);
        
        console.log(`Файл ${filename} успешно создан с ${exportData.length} записями`);
        
        // Показываем статистику
        const totalEmails = exportData.reduce((sum, row) => sum + (row.Email ? row.Email.split(';').length : 0), 0);
        const totalPhones = exportData.reduce((sum, row) => sum + (row['Контактный телефон'] ? row['Контактный телефон'].split(';').length : 0), 0);
        
        console.log(`Статистика: ${totalEmails} email, ${totalPhones} телефонов`);
        
        if (exportData.length > 0) {
            console.log('Пример первой записи:', exportData[0]);
        }
        
        return filename;
        
    } catch (error) {
        console.error('Ошибка при экспорте в Excel:', error);
        throw error;
    }
}
}