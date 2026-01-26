import React, { useState, useEffect } from 'react';
import { 
    BitrixService,
    getAllSmartProcesses, 
    getFieldsItem, 
    readExcelFile,
    mockProcesses,
    mockFields 
} from './bitrixService';
import { importExcelToBitrix } from './importExcelToBitrix';
import './styles.css';
import Swal from 'sweetalert2';

const SmartProcessUpdater = () => {
    const [processList, setProcessList] = useState([]);
    const [selectedProcess, setSelectedProcess] = useState('');
    const [entityTypeId, setEntityTypeId] = useState('');
    const [excelFile, setExcelFile] = useState(null);
    const [excelData, setExcelData] = useState(null);
    const [fields, setFields] = useState(null);
    const [mapping, setMapping] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [apiError, setApiError] = useState(null);
    const [useMockData, setUseMockData] = useState(false);
    const [importLogs, setImportLogs] = useState([]); // ИЗМЕНИТЬ: было null, стало []
    const [isImporting, setIsImporting] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [progress, setProgress] = useState(0);
    const [sdkAvailable, setSdkAvailable] = useState(true);
    const [sdkError, setSdkError] = useState(null);
    
    // Создаем экземпляр сервиса
    const b24Service = new BitrixService('https://acceptgroup.bitrix24.ru/rest/116/c1o0f03s3eluvrmo/');

    useEffect(() => {
        const checkSDK = async () => {
            try {
                // УПРОЩЕННАЯ проверка - просто тестовый вызов
                // Вместо init() делаем простой тестовый запрос
                await b24Service.call('crm.type.list', {
                    start: 0,
                    order: { entityTypeId: 'DESC' }
                });
                setSdkAvailable(true);
                setSdkError(null);
            } catch (error) {
                console.log('SDK недоступен, используем демо-режим:', error.message);
                setSdkAvailable(false);
                setSdkError(error.message);
                setUseMockData(true); // Автоматически переключаемся на демо-режим
            }
        };

        checkSDK();
        loadProcesses();
        
        const savedEntityTypeId = sessionStorage.getItem('entityTypeId');
        const savedExcelData = sessionStorage.getItem('excelData');
        const savedMapping = sessionStorage.getItem('mapping');
        
        if (savedEntityTypeId) {
            setEntityTypeId(savedEntityTypeId);
            setSelectedProcess(savedEntityTypeId);
            setCurrentStep(2);
        }
        if (savedExcelData) {
            setExcelData(JSON.parse(savedExcelData));
            setCurrentStep(3);
        }
        if (savedMapping) {
            setMapping(JSON.parse(savedMapping));
        }
    }, []);

    const loadProcesses = async () => {
        setLoading(true);
        setApiError(null);
        
        try {
            let result;
            
            if (useMockData || !sdkAvailable) {
                // Используем мок данные
                console.log('Используем мок данные');
                await new Promise(resolve => setTimeout(resolve, 1000));
                result = mockProcesses;
            } else {
                // Пробуем реальный API
                console.log('Пробуем реальный API');
                result = await getAllSmartProcesses(b24Service);
                
                // Если API не доступен, переключаемся на мок данные
                if (!result.success) {
                    console.log('API недоступно, переключаемся на мок данные');
                    setUseMockData(true);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    result = mockProcesses;
                }
            }
            
            if (result.success) {
                setProcessList(Object.values(result.data));
            } else {
                setApiError(result.error);
            }
        } catch (error) {
            console.error('Ошибка загрузки процессов:', error);
            setApiError(error.message);
            // При ошибке переключаемся на мок данные
            setUseMockData(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setProcessList(Object.values(mockProcesses.data));
        } finally {
            setLoading(false);
        }
    };

    const handleProcessSelect = async (e) => {
        e.preventDefault();
        if (!selectedProcess) {
            Swal.fire({
                icon: 'warning',
                title: 'Внимание',
                text: 'Пожалуйста, выберите смарт-процесс'
            });
            return;
        }

        setEntityTypeId(selectedProcess);
        sessionStorage.setItem('entityTypeId', selectedProcess);
        setCurrentStep(2);

        setLoading(true);
        setApiError(null);
        
        try {
            let fieldsResult;
            
            if (useMockData || !sdkAvailable) {
                // Используем мок данные полей
                await new Promise(resolve => setTimeout(resolve, 500));
                fieldsResult = mockFields;
            } else {
                // Реальный запрос к API
                fieldsResult = await getFieldsItem(b24Service, parseInt(selectedProcess));
                
                if (!fieldsResult.success) {
                    setUseMockData(true);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    fieldsResult = mockFields;
                }
            }
            
            if (fieldsResult.success) {
                setFields(fieldsResult.data);
            } else {
                setApiError(fieldsResult.error);
            }
        } catch (error) {
            console.error('Ошибка загрузки полей:', error);
            setApiError(error.message);
            // При ошибке используем мок данные
            setUseMockData(true);
            setFields(mockFields.data);
        } finally {
            setLoading(false);
        }
    };

    // Обработка загрузки Excel файла
    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!excelFile) {
            Swal.fire({
                icon: 'warning',
                title: 'Внимание',
                text: 'Пожалуйста, выберите файл'
            });
            return;
        }

        if (!entityTypeId) {
            Swal.fire({
                icon: 'warning',
                title: 'Внимание',
                text: 'Пожалуйста, сначала выберите смарт-процесс'
            });
            return;
        }

        setLoading(true);
        try {
            const result = await readExcelFile(excelFile);
            setExcelData(result);
            setUploadedFileName(excelFile.name);
            sessionStorage.setItem('excelData', JSON.stringify(result));
            setCurrentStep(3);
            
            // Инициализируем маппинг
            const initialMapping = {};
            result.columns.forEach(column => {
                initialMapping[column] = '';
            });
            setMapping(initialMapping);
            
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Ошибка чтения файла: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Обработка изменения маппинга
    const handleMappingChange = (excelColumn, bitrixField) => {
        const newMapping = {
            ...mapping,
            [excelColumn]: bitrixField
        };
        setMapping(newMapping);
        sessionStorage.setItem('mapping', JSON.stringify(newMapping));
    };

    // Очистка сессии
    const clearSession = () => {
        setSelectedProcess('');
        setEntityTypeId('');
        setExcelFile(null);
        setExcelData(null);
        setFields(null);
        setMapping({});
        setUploadedFileName('');
        setCurrentStep(1);
        
        sessionStorage.removeItem('entityTypeId');
        sessionStorage.removeItem('excelData');
        sessionStorage.removeItem('mapping');
    };

    // Отправка данных на импорт
    const handleImport = async (e) => {
        e.preventDefault();

        if (Object.values(mapping).every(value => !value)) {
            Swal.fire({
                icon: 'warning',
                title: 'Внимание',
                text: 'Пожалуйста, сопоставьте хотя бы одно поле'
            });
            return;
        }

        if (!excelData || excelData.rows.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Внимание',
                text: 'Нет данных для импорта'
            });
            return;
        }

        setImportLogs([]);
        setIsImporting(true);
        setIsCancelled(false);
        setProgress(0);

        try {
            const total = excelData.rows.length;

            const summary = await importExcelToBitrix(
                b24Service,
                entityTypeId,
                excelData.rows,
                mapping,
                (log, index) => {
                    // обновляем логи
                    setImportLogs(prev => [...prev, log]);
                    // обновляем прогресс
                    setProgress(Math.round(((index + 1) / total) * 100));
                },
                () => isCancelled // callback для проверки отмены
            );

            if (isCancelled) {
                Swal.fire({
                    icon: 'info',
                    title: 'Импорт отменён',
                    text: 'Процесс был прерван пользователем.',
                });
                return;
            }

            Swal.fire({
                icon: summary.success ? 'success' : 'warning',
                title: 'Импорт завершён',
                html: `
                    <p>Обработано записей: ${summary.processed}</p>
                    <p>Создано новых: ${summary.created}</p>
                    <p>Обновлено существующих: ${summary.updated}</p>
                    <p>Ошибок: ${summary.errors.length}</p>
                `
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: error.message
            });
        } finally {
            setIsImporting(false);
        }
    };

    const cancelImport = () => {
        setIsCancelled(true);
        setIsImporting(false);
    };

    return (
        <div className="app-container">
            <div className="header">
                <h1>Импорт данных в смарт-процессы</h1>
                <p>Массовое обновление элементов Bitrix24</p>
            </div>

            {/* Режим работы */}
            <div className="mode-indicator">
                Режим: {useMockData || !sdkAvailable ? 'Демо данные' : 'Реальный Bitrix24'}
                {!sdkAvailable && (
                    <span style={{color: '#f59e0b', marginLeft: '10px'}}>
                        (Работаем в демо-режиме)
                    </span>
                )}
                {apiError && (
                    <span style={{color: '#dc2626', marginLeft: '10px'}}>
                        (Ошибка: {apiError})
                    </span>
                )}
            </div>

            {/* Прогресс бар шагов */}
            <div className="progress-bar">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <span>Выбор процесса</span>
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <span>Загрузка файла</span>
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <span>Сопоставление</span>
                </div>
            </div>

            {/* Шаг 1: Выбор процесса */}
            {currentStep === 1 && (
                <div className="step-container">
                    <div className="card">
                        <h2>Выберите смарт-процесс</h2>
                        <form onSubmit={handleProcessSelect} className="form">
                            <div className="form-group">
                                <select 
                                    value={selectedProcess} 
                                    onChange={(e) => setSelectedProcess(e.target.value)}
                                    className="form-select"
                                    required
                                >
                                    <option value="">-- Выберите смарт-процесс --</option>
                                    {processList.map(process => (
                                        <option key={process.entityTypeId} value={process.entityTypeId}>
                                            {process.name} (ID: {process.entityTypeId})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading || !selectedProcess}>
                                {loading ? 'Загрузка...' : 'Продолжить'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Шаг 2: Загрузка файла */}
            {currentStep === 2 && (
                <div className="step-container">
                    <div className="card">
                        <div className="step-header">
                            <h2>Загрузите Excel файл</h2>
                            <button onClick={clearSession} className="btn-text">Сменить процесс</button>
                        </div>
                        <p className="process-info">Выбранный процесс: <strong>ID {entityTypeId}</strong></p>
                        
                        <form onSubmit={handleFileUpload} className="form">
                            <div className="file-upload-area">
                                <input 
                                    type="file" 
                                    accept=".xls,.xlsx" 
                                    onChange={(e) => setExcelFile(e.target.files[0])}
                                    className="file-input"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="file-upload-label">
                                    <div className="upload-icon">📎</div>
                                    <div className="upload-text">
                                        <strong>Выберите Excel файл</strong>
                                        <span>или перетащите его сюда</span>
                                    </div>
                                </label>
                                {excelFile && (
                                    <div className="file-info">
                                        📄 {excelFile.name}
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading || !excelFile}>
                                {loading ? 'Обработка...' : 'Загрузить и продолжить'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Шаг 3: Сопоставление полей */}
            {currentStep === 3 && (
                <div className="step-container">
                    <div className="card">
                        <div className="step-header">
                            <h2>Сопоставление полей</h2>
                            <div>
                                <button onClick={() => setCurrentStep(2)} className="btn-text">Назад</button>
                                <button onClick={clearSession} className="btn-text" style={{marginLeft: '10px'}}>Новый импорт</button>
                            </div>
                        </div>
                        
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Процесс:</label>
                                <span>ID {entityTypeId}</span>
                            </div>
                            <div className="info-item">
                                <label>Файл:</label>
                                <span>{uploadedFileName}</span>
                            </div>
                            <div className="info-item">
                                <label>Записей:</label>
                                <span>{excelData?.rows?.length || 0}</span>
                            </div>
                        </div>

                        <form onSubmit={handleImport} className="form">
                            <div className="mapping-container">
                                <div className="mapping-header">
                                    <div className="mapping-col">Поле в Excel</div>
                                    <div className="mapping-col">Поле в Bitrix24</div>
                                </div>
                                <div className="mapping-list">
                                    {excelData?.columns.map((column, index) => (
                                        <div key={index} className="mapping-row">
                                            <div className="mapping-col">
                                                <div className="excel-field">{column}</div>
                                            </div>
                                            <div className="mapping-col">
                                                <select 
                                                    value={mapping[column] || ''}
                                                    onChange={(e) => handleMappingChange(column, e.target.value)}
                                                    className="field-select"
                                                >
                                                    <option value="">-- Не использовать --</option>
                                                    <option value="id">ID элемента (для обновления)</option>
                                                    {fields && Object.entries(fields).map(([fieldCode, fieldInfo]) => {
                                                        const title = fieldInfo.title || fieldInfo.formLabel || fieldCode;
                                                        return (
                                                            <option key={fieldCode} value={fieldCode}>
                                                                {title} ({fieldCode})
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="action-bar">
                                {isImporting && (
                                    <div className="import-progress">
                                        <div className="progress-bar-container">
                                            <div 
                                                className="progress-fill" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <p>{progress}% завершено</p>
                                        <button 
                                            onClick={cancelImport} 
                                            className="btn-secondary"
                                        >
                                            Отменить импорт
                                        </button>
                                    </div>
                                )}
                                
                                <button 
                                    type="submit" 
                                    className="btn-primary large" 
                                    disabled={loading || isImporting}
                                >
                                    {isImporting ? 'Идёт импорт...' : '🚀 Начать импорт'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Логи импорта */}
            {importLogs.length > 0 && (
                <div className="import-logs">
                    <h3>Логи импорта:</h3>
                    <div className="logs-container">
                        {importLogs.map((log, i) => (
                            <div 
                                key={i} 
                                className="log-entry"
                                style={{
                                    color: log.includes('❌') ? '#dc2626' :
                                           log.includes('✅') ? '#16a34a' :
                                           log.includes('➕') ? '#2563eb' : '#000000'
                                }}
                            >
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Индикатор загрузки */}
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Загрузка...</p>
                </div>
            )}
        </div>
    );
};

export default SmartProcessUpdater;