import React, { useState, useCallback, useRef } from "react";
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Alert,
    LinearProgress,
    Chip,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import { ParserService } from "../../services/ParserService";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import InnUploadButtons from '../InnUploadButtons';
import {
    extractInnFromExcel,
    readFromClipboard,
    formatInnText,
    extractInnFromText
} from "../../services/ExcelLoading";

const ParseSite = () => {
    const [inn, setInn] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [parsedData, setParsedData] = useState([]); // Инициализируем как пустой массив, а не null
    const [logs, setLogs] = useState([]);

    // Функция для определения цвета логов
    const getLogColor = useCallback((type) => {
        switch (type) {
            case "success": return "#10b981";
            case "error": return "#ef4444";
            case "warning": return "#fbbf24";
            case "info": return "#3b82f6";
            default: return "#9ca3af";
        }
    }, []);

    const addLog = (message, type = "info") => {
        setLogs(prev => [...prev, {
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const handleStartParsing = async () => {
        if (!inn.trim()) {
            addLog("Ошибка: Введите ИНН", "error");
            return;
        }

        setIsParsing(true);
        setProgress(0);
        setParsedData([]); // Сбрасываем на пустой массив
        setLogs([]);

        addLog("Начинаем парсинг...", "info");
        addLog(`Введенные ИНН: ${inn}`, "info");

        try {
            // Парсим список ИНН
            const innArray = ParserService.parseINNList(inn);

            if (!innArray || innArray.length === 0) {
                addLog("Ошибка: Не найдено валидных ИНН", "error");
                setIsParsing(false);
                return;
            }

            addLog(`Найдено ${innArray.length} валидных ИНН`, "info");

            // Запускаем парсинг с обработкой прогресса
            const results = await ParserService.startParsingProcess(innArray, (progressData) => {
                // Обновляем прогресс
                if (progressData.step === 'Общий прогресс') {
                    setProgress(progressData.percent);
                }

                // Добавляем лог
                const logMessage = progressData.message ||
                    `${progressData.inn ? `ИНН ${progressData.inn}: ` : ''}${progressData.step} - ${progressData.status}`;

                addLog(logMessage, progressData.status === 'error' ? 'error' : 'info');
            });

            // Сохраняем результаты (гарантируем, что это массив)
            const safeResults = Array.isArray(results) ? results : [];
            setParsedData(safeResults);

            if (safeResults.length > 0) {
                const successCount = safeResults.filter(r => r?.Статус === 'Успешно').length;
                addLog(`✅ Парсинг завершен! Найдено ${safeResults.length} записей (${successCount} успешно)`, "success");
            } else {
                addLog("⚠️ Не найдено ни одной записи", "warning");
            }

        } catch (error) {
            console.error("Ошибка парсинга:", error);
            addLog(`❌ Ошибка: ${error.message || "Неизвестная ошибка"}`, "error");
        } finally {
            setIsParsing(false);
        }
    };

    const handleExport = () => {
        if (!parsedData || parsedData.length === 0) {
            addLog("Нет данных для экспорта", "error");
            return;
        }

        try {
            addLog("Экспорт данных в Excel...", "info");
            ParserService.exportToExcel(parsedData, `roskomnadzor_${Date.now()}.xlsx`);
            addLog("✅ Данные успешно экспортированы в Excel", "success");
        } catch (error) {
            addLog(`❌ Ошибка при экспорте: ${error.message}`, "error");
        }
    };

    // Хелпер для безопасного доступа к данным
    const getSafeData = () => {
        return Array.isArray(parsedData) ? parsedData : [];
    };

    const successfulCount = getSafeData().filter(item => item?.Статус === 'Успешно').length;
    const totalCount = getSafeData().length;

    const fileInputRef = useRef(null);

    const handleExcelUpload = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const innValues = await extractInnFromExcel(file);

            if (innValues.length > 0) {
                setInn(innValues.join('\n'));
                // Показываем уведомление (если у вас есть система уведомлений)
                alert(`Загружено ${innValues.length} уникальных ИНН из файла "${file.name}"`);
            } else {
                alert('ИНН не найдены в файле. Убедитесь, что файл содержит столбец с ИНН.');
            }

            // Очищаем input
            event.target.value = '';
        } catch (error) {
            console.error('Ошибка при обработке файла:', error);
            alert(error.message || 'Ошибка при обработке файла');
        }
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await readFromClipboard();
            if (text.trim()) {
                const formattedText = formatInnText(text);
                setInn(formattedText);

                // Подсчет количества ИНН
                const innArray = extractInnFromText(formattedText);
                if (innArray.length > 0) {
                    alert(`Добавлено ${innArray.length} ИНН из буфера обмена`);
                }
            } else {
                alert('Буфер обмена пуст или не содержит ИНН');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось прочитать из буфера обмена');
        }
    };
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper
                elevation={0}
                sx={{
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                    color: "#fff",
                    p: 4,
                    mb: 4,
                    borderRadius: 3,
                    textAlign: "center"
                }}
            >
                <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                    Парсер данных по ИНН
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Получение информации из реестра операторов Роскомнадзора
                </Typography>
            </Paper>

            {/* Основной контент */}
            <Grid container spacing={3}>
                {/* Левая колонка - форма и прогресс */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: "100%", borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom fontWeight="600" color="#1e293b">
                                Введите ИНН для поиска
                            </Typography>

                            {/* Кнопки загрузки из файла */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                {/* Скрытый input для загрузки файлов */}
                                <input
                                    type="file"
                                    id="excel-upload"
                                    accept=".xlsx,.xls,.csv"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />

                                {/* Используем только компонент с кнопками */}
                                <InnUploadButtons
                                    onExcelUpload={handleExcelUpload}
                                    onPasteFromClipboard={handlePasteFromClipboard}
                                    disabled={isParsing}
                                />
                            </Box>


                            <Box sx={{ my: 3 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    maxRows={6}
                                    label="ИНН организации (через запятую или с новой строки)"
                                    variant="outlined"
                                    value={inn}
                                    onChange={(e) => setInn(e.target.value)}
                                    disabled={isParsing}
                                    placeholder="Пример:
                                                1111111111
                                                2222222222
                                                3333333333
                                                Или через запятую: 1111111111, 2222222222, 3333333333"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 2,
                                            "&.Mui-focused fieldset": {
                                                borderColor: "#667eea",
                                            },
                                        },
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Поддерживаются ИНН длиной 10 или 12 цифр
                                </Typography>
                            </Box>

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleStartParsing}
                                disabled={isParsing || !inn.trim()}
                                startIcon={<SearchIcon />}
                                sx={{
                                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontSize: "1.1rem",
                                    fontWeight: 600,
                                    textTransform: "none",
                                    "&:hover": {
                                        background: "linear-gradient(135deg, #5a6fd8, #6a4090)",
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)"
                                    },
                                    "&:disabled": {
                                        background: "#9ca3af",
                                    }
                                }}
                            >
                                {isParsing ? `Идет поиск... ${progress}%` : "Начать парсинг"}
                            </Button>

                            {isParsing && (
                                <Box sx={{ mt: 4 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Общий прогресс
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {progress}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={progress}
                                        sx={{
                                            height: 10,
                                            borderRadius: 5,
                                            backgroundColor: "#e5e7eb",
                                            "& .MuiLinearProgress-bar": {
                                                background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                                                borderRadius: 5,
                                            }
                                        }}
                                    />
                                </Box>
                            )}

                            {totalCount > 0 && (
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="large"
                                    onClick={handleExport}
                                    disabled={totalCount === 0}
                                    startIcon={<DownloadIcon />}
                                    sx={{
                                        mt: 3,
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontSize: "1rem",
                                        fontWeight: 600,
                                        textTransform: "none",
                                        borderColor: "#3b82f6",
                                        color: "#3b82f6",
                                        "&:hover": {
                                            borderColor: "#2563eb",
                                            backgroundColor: "rgba(59, 130, 246, 0.04)"
                                        },
                                        "&:disabled": {
                                            borderColor: "#9ca3af",
                                            color: "#9ca3af"
                                        }
                                    }}
                                >
                                    Экспорт в Excel ({successfulCount}/{totalCount})
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Правая колонка - лог и информация */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: "100%", borderRadius: 3 }}>
                        <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" fontWeight="600" color="#1e293b">
                                    Лог выполнения
                                </Typography>
                                {logs.length > 0 && (
                                    <Button
                                        size="small"
                                        onClick={() => setLogs([])}
                                        sx={{ minWidth: 'auto', p: 0.5 }}
                                    >
                                        Очистить
                                    </Button>
                                )}
                            </Box>

                            <Paper
                                variant="outlined"
                                sx={{
                                    flex: 1,
                                    backgroundColor: "#111827",
                                    color: "#f9fafb",
                                    fontFamily: "monospace",
                                    fontSize: "0.875rem",
                                    p: 2,
                                    borderRadius: 2,
                                    overflow: "auto",
                                    borderColor: "#374151",
                                    minHeight: "300px",
                                    maxHeight: "400px"
                                }}
                            >
                                {logs.length === 0 ? (
                                    <Typography color="#9ca3af" fontStyle="italic">
                                        Лог будет отображаться здесь...
                                    </Typography>
                                ) : (
                                    logs.slice().reverse().map((log) => (
                                        <Box
                                            key={log.id}
                                            sx={{
                                                py: 0.5,
                                                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                                                color: getLogColor(log.type)
                                            }}
                                        >
                                            <Box component="span" sx={{ opacity: 0.6, mr: 2, fontSize: '0.75rem' }}>
                                                [{log.timestamp}]
                                            </Box>
                                            {log.message}
                                        </Box>
                                    ))
                                )}
                            </Paper>

                            {/* Статистика */}
                            {totalCount > 0 && (
                                <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e5e7eb" }}>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="600">
                                        Статистика
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                                                <Typography variant="h6" color="#0369a1">
                                                    {totalCount}
                                                </Typography>
                                                <Typography variant="caption" color="#64748b">
                                                    Всего записей
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f0fdf4', borderRadius: 1 }}>
                                                <Typography variant="h6" color="#059669">
                                                    {successfulCount}
                                                </Typography>
                                                <Typography variant="caption" color="#64748b">
                                                    Успешно
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Результаты парсинга - ТОЛЬКО если есть данные */}
            {totalCount > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" fontWeight="600" color="#1e293b">
                            Результаты поиска
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                label={`Всего: ${totalCount}`}
                                color="default"
                                size="small"
                            />
                            <Chip
                                label={`Успешно: ${successfulCount}`}
                                color="success"
                                size="small"
                                icon={<CheckCircleIcon />}
                            />
                            {totalCount - successfulCount > 0 && (
                                <Chip
                                    label={`Ошибки: ${totalCount - successfulCount}`}
                                    color="error"
                                    size="small"
                                    icon={<ErrorIcon />}
                                />
                            )}
                        </Box>
                    </Box>

                    <TableContainer component={Paper} sx={{ borderRadius: 3, maxHeight: 400, overflow: 'auto' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>ИНН</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Рег. номер</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Наименование оператора</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Статус</TableCell>
                                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {getSafeData().map((item, index) => (
                                    <TableRow
                                        key={index}
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            bgcolor: item?.Статус === 'Успешно' ? 'transparent' : '#fff5f5'
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {item?.ИНН || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {item?.['Регистрационный номер'] || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {item?.['Наименование оператора'] || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item?.Статус || 'Неизвестно'}
                                                size="small"
                                                color={
                                                    item?.Статус === 'Успешно' ? 'success' :
                                                        item?.Статус === 'Не найден' ? 'warning' : 'error'
                                                }
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {item?.ID ? (
                                                <Button
                                                    size="small"
                                                    href={`https://pd.rkn.gov.ru/operators-registry/operators-list/?id=${item.ID}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Открыть
                                                </Button>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">
                                                    Нет ссылки
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {totalCount === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Нет данных для отображения. Запустите парсинг, чтобы увидеть результаты.
                        </Alert>
                    )}
                </Box>
            )}

            {/* Информационные карточки */}
            <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, height: "100%" }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SearchIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="600">
                                    Поиск в реестре
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Поиск операторов персональных данных по ИНН в федеральном реестре Роскомнадзора
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, height: "100%" }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <DownloadIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="600">
                                    Экспорт данных
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Сохранение результатов в Excel-файл с полной информацией о найденных операторах
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, height: "100%" }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <InfoIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="600">
                                    Массовая обработка
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Обработка нескольких ИНН одновременно с отображением прогресса и детальным логом
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ParseSite;