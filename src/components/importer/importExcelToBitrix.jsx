/**
 * Импорт Excel данных в смарт-процесс Bitrix24
 */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function importExcelToBitrix(
    b24Service,
    entityTypeId,
    excelRows,
    mapping,
    onProgress = () => {},
    isCancelled = () => false
) {
    let created = 0;
    let updated = 0;
    const errors = [];

    onProgress(`🚀 Начинаем импорт ${excelRows.length} строк...`);

    for (let i = 0; i < excelRows.length; i++) {

        if (isCancelled()) {
            onProgress('⛔ Импорт отменён пользователем');
            break;
        }

        const row = excelRows[i];
        const fields = {};
        let itemId = null;

        for (const [excelCol, b24Field] of Object.entries(mapping)) {
            const value = row[excelCol];

            if (!b24Field || value == null || value === '') continue;

            if (b24Field.toUpperCase() === 'ID') {
                itemId = parseInt(value) || null;
            } else {
                fields[b24Field] = value;
            }
        }

        try {

            if (itemId) {

                const check = await b24Service.call('crm.item.get', {
                    entityTypeId,
                    id: itemId
                });

                if (check?.result?.item) {

                    await b24Service.call('crm.item.update', {
                        entityTypeId,
                        id: itemId,
                        fields
                    });

                    updated++;
                    onProgress(`✅ [${i + 1}] Обновлен ID ${itemId}`);

                } else {

                    await b24Service.call('crm.item.add', {
                        entityTypeId,
                        fields
                    });

                    created++;
                    onProgress(`➕ [${i + 1}] Создан новый элемент`);
                }

            } else {

                await b24Service.call('crm.item.add', {
                    entityTypeId,
                    fields
                });

                created++;
                onProgress(`➕ [${i + 1}] Создан новый элемент`);
            }

        } catch (err) {

            errors.push(`Строка ${i + 1}: ${err.message}`);
            onProgress(`❌ [${i + 1}] Ошибка: ${err.message}`);

        }

        await sleep(250);
    }

    return {
        processed: excelRows.length,
        created,
        updated,
        errors,
        success: errors.length === 0
    };
}
