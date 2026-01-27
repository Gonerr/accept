// proxy-server.js
const corsAnywhere = require('cors-anywhere');

const host = 'localhost';
const port = 8080; // Прокси на порту 8080

corsAnywhere.createServer({
    originWhitelist: [], // Разрешить все источники
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
    console.log(`CORS Anywhere прокси запущен на http://${host}:${port}`);
});