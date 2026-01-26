
import * as XLSX from 'xlsx';

/**
 * Универсальный сервис Bitrix24, работающий через вебхук
 */
export class BitrixService {



    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl.endsWith('/')
            ? webhookUrl
            : webhookUrl + '/';
    }

    // Вызов REST метода Bitrix24 через вебхук
    async call(method, params = {}) {
        try {
            const response = await fetch(`${this.webhookUrl}${method}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error_description || data.error);

            return data;
        } catch (error) {
            console.error(`Ошибка при вызове метода ${method}:`, error);
            throw error;
        }
    }

    // Вызов batch-команд
    async callBatch(commands) {
        try {
            const cmd = {};
            for (const [alias, [method, params]] of Object.entries(commands)) {
                const query = new URLSearchParams(params).toString();
                cmd[alias] = `${method}?${query}`;
            }

            const response = await fetch(`${this.webhookUrl}batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ cmd }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error_description || data.error);
            return data.result?.result || {};
        } catch (error) {
            console.error('Ошибка batch:', error);
            throw error;
        }
    }

    // Совместимость со старым кодом
    async init() {
        return true;
    }

    getEntityTypeId(processId) {
        return processId;
    }
}

/**
 * Получение списка всех смарт-процессов
 */
export async function getAllSmartProcesses(b24Service) {
    try {
        const response = await b24Service.call('crm.type.list', {
            filter: { isAutomationEnabled: 'Y' },
            order: { entityTypeId: 'DESC' },
        });

        const result = response.result || response;
        if (result.types && Array.isArray(result.types)) {
            const processes = {};
            for (const type of result.types) {
                processes[type.id] = {
                    id: type.id,
                    name: type.title || 'Без названия',
                    entityTypeId: type.entityTypeId || null,
                };
            }
            return { success: true, data: processes };
        }

        return { success: false, error: 'Пустой ответ от Bitrix24' };
    } catch (error) {
        console.error('Ошибка getAllSmartProcesses:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Получение списка полей смарт-процесса
 */
export async function getFieldsItem(b24Service, entityTypeId) {
    try {
        const response = await b24Service.call('crm.item.fields', {
            entityTypeId: entityTypeId,
        });

        const result = response.result || response;
        if (result.fields) {
            return { success: true, data: result.fields };
        }

        return { success: false, error: 'Не удалось получить поля' };
    } catch (error) {
        console.error('Ошибка getFieldsItem:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Получение всех элементов процесса с пагинацией
 */
export async function getAllBitrixItems(b24Service, entityTypeId) {
    try {
        let allItems = [];
        let start = 0;
        const limit = 50;

        while (true) {
            const response = await b24Service.call('crm.item.list', {
                entityTypeId,
                start,
                order: { id: 'ASC' },
            });

            const result = response.result || response;
            if (!result.items?.length) break;

            allItems = [...allItems, ...result.items];
            if (typeof result.next === 'undefined') break;
            start = result.next;
        }

        return { success: true, data: allItems };
    } catch (error) {
        console.error('Ошибка getAllBitrixItems:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Обновление одного поля элемента
 */
export async function updateField(b24Service, entityTypeId, itemId, fieldName, value) {
    try {
        const response = await b24Service.call('crm.item.update', {
            entityTypeId,
            id: itemId,
            fields: { [fieldName]: value },
        });

        if (response.result) {
            return { success: true };
        }
        return { success: false, error: 'Не удалось обновить элемент' };
    } catch (error) {
        console.error('Ошибка updateField:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Массовое обновление всех элементов (пример)
 */
export async function bulkUpdateAll(b24Service, entityTypeId, fieldName, value) {
    try {
        const allItems = await getAllBitrixItems(b24Service, entityTypeId);
        if (!allItems.success) throw new Error(allItems.error);

        const commands = {};
        allItems.data.forEach((item, i) => {
            commands[`update_${i}`] = [
                'crm.item.update',
                {
                    entityTypeId,
                    id: item.id,
                    fields: { [fieldName]: value },
                },
            ];
        });

        const result = await b24Service.callBatch(commands);
        return { success: true, updated: Object.keys(result).length };
    } catch (error) {
        console.error('Ошибка bulkUpdateAll:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Чтение Excel файла и преобразование в JSON
 */
export const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length === 0) {
                    reject(new Error('Файл Excel пустой'));
                    return;
                }

                const firstRow = jsonData[0] || [];
                const columns = firstRow.map(col => String(col));

                const dataRows = jsonData.slice(1).map(row => {
                    const rowObject = {};
                    columns.forEach((column, index) => {
                        rowObject[column] = row[index] ?? '';
                    });
                    return rowObject;
                });

                resolve({ columns, rows: dataRows });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Мок-данные (на случай, если Bitrix API недоступен)
 */
export const mockProcesses = {
    success: true,
    data: {
        101: { id: 101, name: 'Демо процесс 1', entityTypeId: 101 },
        102: { id: 102, name: 'Демо процесс 2', entityTypeId: 102 },
    },
};

export const mockFields = {
    success: true,
    data: {
        TITLE: { title: 'Название', type: 'string' },
        UF_DEPARTMENT: { title: 'Отдел', type: 'crm_multifield' },
        UF_STATUS: { title: 'Статус', type: 'string' },
    },
};
