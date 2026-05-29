const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Helmet con CSP más permisiva para el admin
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com'],
      scriptSrcAttr: ['\'self\'', '\'unsafe-inline\''], // Para eventos inline como onclick
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com'],
      imgSrc: ['\'self\'', 'data:'],
      fontSrc: ['\'self\'', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'],
      mediaSrc: ['\'self\'', 'data:'], // Para reproducir audio
      connectSrc: ['\'self\''],
      frameSrc: ['\'none\'']
    }
  }
}));
// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter for API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes, intenta mas tarde' }
});
app.use('/api/', limiter);

// All routes
app.use('/', routes);

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    mensaje: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log('Servidor escuchando en puerto ' + PORT);
});

module.exports = app;
