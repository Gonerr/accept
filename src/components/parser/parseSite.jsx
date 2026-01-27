import React, { useState } from "react";
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
  IconButton,
  Card,
  CardContent,
  Grid
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon
} from "@mui/icons-material";
import { ParserService } from "../../services/ParserService";

const ParseSite = () => {
  const [inn, setInn] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = "info") => {
    setLogs(prev => [...prev, { 
      id: Date.now(), 
      message, 
      type,
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const handleStartParsing = () => {
    if (!inn.trim()) {
      addLog("Ошибка: Введите ИНН", "error");
      return;
    }

    setIsParsing(true);
    setProgress(0);
    setParsedData(null);
    setLogs([]);

    addLog("Начинаем парсинг...", "info");
    addLog(`ИНН: ${inn}`, "info");
    ParserService.startParsingProcess();

    // // Имитация процесса парсинга
    // const interval = setInterval(() => {
    //   setProgress(prev => {
    //     const newProgress = prev + 10;
        
    //     if (newProgress === 10) addLog("Поиск компании в реестрах...", "info");
    //     if (newProgress === 30) addLog("Получение основных данных...", "info");
    //     if (newProgress === 50) addLog("Поиск контактной информации...", "info");
    //     if (newProgress === 70) addLog("Сбор финансовых данных...", "info");
    //     if (newProgress === 90) addLog("Обработка результатов...", "info");
        
    //     if (newProgress >= 100) {
    //       clearInterval(interval);
    //       setTimeout(() => {
    //         setIsParsing(false);
    //         setParsedData({
    //           companyName: "ООО 'Примерная Компания'",
    //           inn: inn,
    //           ogrn: "1234567890123",
    //           kpp: "770501001",
    //           address: "г. Москва, ул. Примерная, д. 1",
    //           ceo: "Иванов Иван Иванович",
    //           emails: ["info@example.ru", "sales@example.ru"],
    //           phones: ["+7 (495) 123-45-67", "+7 (495) 765-43-21"],
    //           website: "https://example.ru",
    //           status: "Действующая",
    //           registrationDate: "15.01.2020",
    //           activities: ["Торговля оптовая", "Деятельность консультационная"]
    //         });
    //         addLog("✅ Парсинг успешно завершен!", "success");
    //         addLog(`Найдено: ${inn} - ООО 'Примерная Компания'`, "success");
    //       }, 500);
    //       return 100;
    //     }
    //     return newProgress;
    //   });
    // }, 300);

  };

  const handleExport = () => {
    addLog("Экспорт данных в Excel...", "info");
    setTimeout(() => {
      addLog("✅ Данные успешно экспортированы в Excel", "success");
    }, 1000);
  };

  const getLogColor = (type) => {
    switch (type) {
      case "success": return "#10b981";
      case "error": return "#ef4444";
      case "warning": return "#fbbf24";
      case "info": return "#3b82f6";
      default: return "#9ca3af";
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
          Получение полной информации о компании по налоговому номеру
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
              
              <Box sx={{ my: 3 }}>
                <TextField
                  fullWidth
                  label="ИНН организации (10 или 12 цифр)"
                  variant="outlined"
                  value={inn}
                  onChange={(e) => setInn(e.target.value)}
                  disabled={isParsing}
                  placeholder="1234567890"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&.Mui-focused fieldset": {
                        borderColor: "#667eea",
                      },
                    },
                  }}
                />
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
                {isParsing ? "Идет поиск..." : "Начать парсинг"}
              </Button>

              {isParsing && (
                <Box sx={{ mt: 4 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Прогресс
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

              {parsedData && (
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleExport}
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
                    }
                  }}
                >
                  Экспорт в Excel
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Правая колонка - лог и информация */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%", borderRadius: 3 }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography variant="h5" gutterBottom fontWeight="600" color="#1e293b">
                Лог выполнения
              </Typography>
              
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
                  logs.map((log) => (
                    <Box
                      key={log.id}
                      sx={{
                        py: 0.5,
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        color: getLogColor(log.type)
                      }}
                    >
                      <Box component="span" sx={{ opacity: 0.6, mr: 2 }}>
                        [{log.timestamp}]
                      </Box>
                      {log.message}
                    </Box>
                  ))
                )}
              </Paper>

              {/* Инструкция */}
              <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e5e7eb" }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="600">
                  Как это работает:
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Введите ИНН организации (10 цифр для юрлиц, 12 для ИП)" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <SearchIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Система найдет компанию в государственных реестрах" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Соберет контактные данные, email и телефоны" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <DownloadIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Результаты можно будет экспортировать в Excel" />
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Результаты парсинга */}
      {parsedData && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="600" color="#1e293b">
            Результаты поиска
          </Typography>
          
          <Grid container spacing={3}>
            {/* Основная информация */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Основная информация
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Название
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {parsedData.companyName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Статус
                      </Typography>
                      <Chip 
                        label={parsedData.status}
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        ИНН
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {parsedData.inn}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        ОГРН
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {parsedData.ogrn}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Адрес
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {parsedData.address}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Контактная информация */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Контактная информация
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email адреса
                    </Typography>
                    {parsedData.emails.map((email, index) => (
                      <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <EmailIcon sx={{ mr: 1, color: "#667eea", fontSize: 20 }} />
                        <Typography variant="body1">{email}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Телефоны
                    </Typography>
                    {parsedData.phones.map((phone, index) => (
                      <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <PhoneIcon sx={{ mr: 1, color: "#667eea", fontSize: 20 }} />
                        <Typography variant="body1">{phone}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {parsedData.website && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Веб-сайт
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LanguageIcon sx={{ mr: 1, color: "#667eea", fontSize: 20 }} />
                        <Typography 
                          variant="body1"
                          component="a"
                          href={parsedData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: "#3b82f6", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                        >
                          {parsedData.website}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Информационные карточки */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                📊 Данные из ЕГРЮЛ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Полная информация из Единого государственного реестра юридических лиц
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                🔍 Финансовая отчетность
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Бухгалтерская отчетность и финансовые показатели компании
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                📈 Анализ деятельности
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Оценка рисков и анализ хозяйственной деятельности
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ParseSite;