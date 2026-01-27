
// Получение информации об объекте по заданным параметрам
export async function getBitrixItem(b24Service, entityTypeId, itemId) {
    try {
        const response = await b24Service.call('crm.item.get', {
            entityTypeId: parseInt(entityTypeId),
            id: parseInt(itemId)
        });
        
        return {
            success: true,
            data: response,
            error: null
        };
        
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

// Функция для получения полей какой-либо сущности
export async function getFieldsItem(b24Service, entityTypeId) {
    try {
        const response = await b24Service.call('crm.item.fields', {
            entityTypeId: parseInt(entityTypeId),
        });
        
        return {
            success: true,
            data: response,
            error: null
        };
        
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

export async function updateField(b24Service, entityTypeId, itemId, fieldName, fieldValue) {
    try {
        const response = await b24Service.call('crm.item.update', {
            entityTypeId: parseInt(entityTypeId),
            id: parseInt(itemId),
            fields: { [fieldName]: fieldValue }
        });

        return {
            success: true,
            data: response,
            error: null
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Получение списка элементов
export async function getAllBitrixItems(b24Service, entityTypeId) {
    try {
        const allItems = [];
        let start = 0;
        
        do {
            const response = await b24Service.call('crm.item.list', {
                entityTypeId: parseInt(entityTypeId),
                select: ['*', 'UF_*'],
                start: start,
                order: { ID: 'ASC' }
            });
            
            if (response.items) {
                allItems.push(...response.items);
                start = response.next || 0;
            } else {
                break;
            }
            
        } while (start > 0);
        
        return {
            success: true,
            data: allItems,
            count: allItems.length
        };
        
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
}

export async function bulkUpdateByDepartment(b24Service, entityTypeId, departmentFieldName, departmentValue, targetFieldName, targetFieldValue) {
    try {
        const updatedItemIds = [];
        const failedItems = [];
        let start = 0;
        const allIds = [];

        // Получаем все ID элементов
        do {
            const response = await b24Service.call('crm.item.list', {
                entityTypeId: parseInt(entityTypeId),
                filter: { [departmentFieldName]: departmentValue },
                select: ['ID'],
                start: start,
                order: { ID: 'ASC' }
            });

            const items = response.items || [];
            start = response.next || 0;

            for (const item of items) {
                if (item.id) {
                    allIds.push(parseInt(item.id));
                }
            }
        } while (start > 0);

        // Выполняем пакетное обновление
        const chunkSize = 50;
        
        for (let i = 0; i < allIds.length; i += chunkSize) {
            const chunkIds = allIds.slice(i, i + chunkSize);
            const commands = {};
            
            // Формируем команды для batch
            chunkIds.forEach((itemId, idx) => {
                commands[`update_${i + idx}`] = [
                    'crm.item.update',
                    {
                        entityTypeId: parseInt(entityTypeId),
                        id: itemId,
                        fields: { [targetFieldName]: targetFieldValue }
                    }
                ];
            });

            try {
                const batchResult = await b24Service.callBatch(commands);
                
                // Обрабатываем результаты
                chunkIds.forEach((itemId, idx) => {
                    const cmdKey = `update_${i + idx}`;
                    const result = batchResult[cmdKey];
                    
                    if (result && result.error) {
                        failedItems.push({ 
                            id: itemId, 
                            error: result.error 
                        });
                    } else {
                        updatedItemIds.push(itemId);
                    }
                });
            } catch (error) {
                // Если весь batch упал, добавляем все элементы в failed
                chunkIds.forEach(itemId => {
                    failedItems.push({ 
                        id: itemId, 
                        error: error.message 
                    });
                });
            }
        }

        return {
            success: true,
            data: {
                updatedCount: updatedItemIds.length,
                updatedItemIds: updatedItemIds,
                failedCount: failedItems.length,
                failedItems: failedItems,
            },
            error: null
        };

    } catch (error) {
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

export async function bulkUpdateAll(b24Service, entityTypeId, targetFieldName, targetFieldValue) {
    try {
        const updatedItemIds = [];
        const failedItems = [];
        let start = 0;
        const allIds = [];

        // Получаем все ID элементов
        do {
            const response = await b24Service.call('crm.item.list', {
                entityTypeId: parseInt(entityTypeId),
                select: ['ID'],
                start: start,
                order: { ID: 'ASC' }
            });

            const items = response.items || [];
            start = response.next || 0;

            for (const item of items) {
                if (item.id) {
                    allIds.push(parseInt(item.id));
                }
            }
        } while (start > 0);

        // Выполняем пакетное обновление
        const chunkSize = 50;
        
        for (let i = 0; i < allIds.length; i += chunkSize) {
            const chunkIds = allIds.slice(i, i + chunkSize);
            const commands = {};
            
            // Формируем команды для batch
            chunkIds.forEach((itemId, idx) => {
                commands[`update_${i + idx}`] = [
                    'crm.item.update',
                    {
                        entityTypeId: parseInt(entityTypeId),
                        id: itemId,
                        fields: { [targetFieldName]: targetFieldValue }
                    }
                ];
            });

            try {
                const batchResult = await b24Service.callBatch(commands);
                
                // Обрабатываем результаты
                chunkIds.forEach((itemId, idx) => {
                    const cmdKey = `update_${i + idx}`;
                    const result = batchResult[cmdKey];
                    
                    if (result && result.error) {
                        failedItems.push({ 
                            id: itemId, 
                            error: result.error 
                        });
                    } else {
                        updatedItemIds.push(itemId);
                    }
                });
            } catch (error) {
                // Если весь batch упал, добавляем все элементы в failed
                chunkIds.forEach(itemId => {
                    failedItems.push({ 
                        id: itemId, 
                        error: error.message 
                    });
                });
            }
        }

        return {
            success: true,
            data: {
                updatedCount: updatedItemIds.length,
                updatedItemIds: updatedItemIds,
                failedCount: failedItems.length,
                failedItems: failedItems,
            },
            error: null
        };

    } catch (error) {
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

/**
 * Получение всех смарт-процессов и их названий
 */
export async function getAllSmartProcesses(b24Service) {
    try {
        const response = await b24Service.call('crm.type.list', {
            filter: {
                isAutomationEnabled: 'Y'
            },
            order: { entityTypeId: 'DESC' }
        });
        
        if (response.types) {
            const processes = {};
            for (const type of response.types) {
                processes[type.id] = {
                    id: type.id,
                    name: type.title || 'Без названия',
                    entityTypeId: type.entityTypeId || null
                };
            }
            
            return {
                success: true,
                data: processes,
                count: Object.keys(processes).length
            };
        }
        
        return {
            success: false,
            data: null,
            error: 'Не удалось получить список процессов'
        };
        
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

/**
 * Получение полей смарт-процесса по его ID или названию
 */
export async function getSmartProcessFields(b24Service, processIdentifier) {
    try {
        let entityTypeId;
        
        // Если передан не ID, а название - находим ID по названию
        if (isNaN(processIdentifier)) {
            const processes = await getAllSmartProcesses(b24Service);
            if (!processes.success) {
                return processes;
            }
            
            entityTypeId = null;
            for (const process of Object.values(processes.data)) {
                if (process.name.toLowerCase() === processIdentifier.toLowerCase()) {
                    entityTypeId = process.entityTypeId;
                    break;
                }
            }
            
            if (!entityTypeId) {
                return {
                    success: false,
                    data: null,
                    error: `Смарт-процесс с названием '${processIdentifier}' не найден`
                };
            }
        } else {
            entityTypeId = parseInt(processIdentifier);
        }
        
        const response = await b24Service.call('crm.item.fields', {
            entityTypeId: entityTypeId,
            useOriginalUfNames: 'N'
        });
        
        // Форматируем поля для удобного использования
        const formattedFields = {};
        for (const [fieldCode, fieldInfo] of Object.entries(response)) {
            formattedFields[fieldCode] = {
                code: fieldCode,
                title: fieldInfo.title || fieldInfo.formLabel || fieldCode,
                type: fieldInfo.type || 'unknown',
                isRequired: fieldInfo.isRequired || false,
                isReadOnly: fieldInfo.isReadOnly || false,
                isDynamic: fieldInfo.isDynamic || false
            };
        }
        
        return {
            success: true,
            data: formattedFields,
            entityTypeId: entityTypeId,
            count: Object.keys(formattedFields).length
        };
        
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

/**
 * Обновление поля с использованием названия процесса вместо ID
 */
export async function updateFieldByProcessName(b24Service, processName, itemId, fieldName, fieldValue) {
    try {
        // Получаем entityTypeId по названию процесса
        const fieldsInfo = await getSmartProcessFields(b24Service, processName);
        if (!fieldsInfo.success) {
            return {
                success: false,
                error: fieldsInfo.error
            };
        }
        
        const entityTypeId = fieldsInfo.entityTypeId;
        
        // Проверяем существование поля
        if (!fieldsInfo.data[fieldName]) {
            return {
                success: false,
                error: `Поле '${fieldName}' не найдено в процессе '${processName}'`
            };
        }
        
        // Выполняем обновление
        return await updateField(b24Service, entityTypeId, itemId, fieldName, fieldValue);
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Массовое обновление по названию процесса
 */
export async function bulkUpdateByDepartmentProcessName(b24Service, processName, departmentFieldName, departmentValue, targetFieldName, targetFieldValue) {
    try {
        const fieldsInfo = await getSmartProcessFields(b24Service, processName);
        if (!fieldsInfo.success) {
            return {
                success: false,
                error: fieldsInfo.error
            };
        }
        
        const entityTypeId = fieldsInfo.entityTypeId;
        
        return await bulkUpdateByDepartment(
            b24Service,
            entityTypeId,
            departmentFieldName,
            departmentValue,
            targetFieldName,
            targetFieldValue
        );
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Массовое обновление всех элементов по названию процесса
 */
export async function bulkUpdateAllByProcessName(b24Service, processName, targetFieldName, targetFieldValue) {
    try {
        const fieldsInfo = await getSmartProcessFields(b24Service, processName);
        if (!fieldsInfo.success) {
            return {
                success: false,
                error: fieldsInfo.error
            };
        }
        
        const entityTypeId = fieldsInfo.entityTypeId;
        
        return await bulkUpdateAll(
            b24Service,
            entityTypeId,
            targetFieldName,
            targetFieldValue
        );
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

