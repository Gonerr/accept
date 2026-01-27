// services/ParserService.js 
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import { parse } from 'node-html-parser';

export class ParserService {
    
    static parseINNList(inputString) {
        if (!inputString) return [];
        return inputString.split(/[,;\s\n]+/).map(inn => inn.trim()).filter(inn => inn.length > 0);
    }

    static async fetchOperatorId(inn) {
        const url = `https://pd.rkn.gov.ru/operators-registry/operators-list/?act=search&name_full=&inn=${inn}&regn=`;
        try {
            const response = await axios.get(url);
            const html = response.data;
            const root = parse(html);
            
            console.log('root = ',root);
            const linkElement = root.querySelector('tbody tr td a[href*="?id="]');
            if (linkElement) {
                const href = linkElement.getAttribute('href');
                // Извлекаем id из href, например "?id=77-22-094943"
                const match = href.match(/\?id=([^&]+)/);
                return match ? match[1] : null;
            }
            return null; 
        } catch (error) {
            console.error(`Ошибка при поиске ID для ИНН ${inn}:`, error.message);
            throw error;
        }
    }

    static async fetchOperatorDetails(id) {
        const url = `https://pd.rkn.gov.ru/operators-registry/operators-list/?id=${id}`;
        try {
            const response = await axios.get(url);
            const html = response.data;
            const root = parse(html);
            
            console.log('root: ', root)
            const result = { id: id };
            
            const rows = root.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const key = cells[0].text.trim();
                    const value = cells[1].text.trim();
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
        const allResults = [];
        
        for (let i = 0; i < innList.length; i++) {
            const inn = innList[i];
            try {
                if (onProgress) onProgress({ inn, step: 'Поиск ID', status: 'start', index: i });
                
                // Шаг 1: Получаем ID
                const operatorId = await this.fetchOperatorId(inn);
                if (!operatorId) {
                    if (onProgress) onProgress({ inn, step: 'Поиск ID', status: 'error', message: 'ID не найден' });
                    continue;
                }
                if (onProgress) onProgress({ inn, step: 'Поиск ID', status: 'success', id: operatorId });
                
                // Шаг 2: Получаем детали
                if (onProgress) onProgress({ inn, step: 'Получение деталей', status: 'start', id: operatorId });
                const details = await this.fetchOperatorDetails(operatorId);
                allResults.push({ inn, ...details });
                if (onProgress) onProgress({ inn, step: 'Получение деталей', status: 'success' });
                
            } catch (error) {
                if (onProgress) onProgress({ inn, step: 'Ошибка', status: 'error', message: error.message });
            }
        }
        return allResults;
    }

    static exportToExcel(data, filename = 'roskomnadzor_data.xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Операторы');
        XLSX.writeFile(workbook, filename);
    }
}