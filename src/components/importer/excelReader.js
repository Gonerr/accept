

// Функция для чтения Excel файла
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
                const columns = firstRow.map(col => 
                    Array.isArray(col) ? col.join(', ') : String(col)
                );

                const dataRows = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] || [];
                    const rowValues = row.map(val => 
                        Array.isArray(val) ? val.join(', ') : String(val)
                    );
                    
                    const rowObject = {};
                    columns.forEach((column, index) => {
                        rowObject[column] = rowValues[index] || '';
                    });
                    
                    dataRows.push(rowObject);
                }

                resolve({ columns, rows: dataRows });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsArrayBuffer(file);
    });
};
