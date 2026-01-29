// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/proxy',
    createProxyMiddleware({
      target: 'https://pd.rkn.gov.ru',
      changeOrigin: true,
      pathRewrite: {
        '^/api/proxy': '/operators-registry/operators-list'
      },
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      }
    })
  );
};