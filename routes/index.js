const express = require('express');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

// Generar token CSRF
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Serve HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

router.get('/registro', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'registro.html'));
});

router.get('/validacion', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'validacion.html'));
});

// Admin HTML pages - con CSRF token embebido
router.get('/adm', (req, res) => {
  // Generar CSRF token y guardarlo en cookie
  const csrfToken = generateCsrfToken();
  res.cookie('XSRF-TOKEN', csrfToken, { httpOnly: false, secure: false, sameSite: 'lax' });
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'index.html'));
});

router.get('/adm/login', (req, res) => {
  // Generar CSRF token y guardarlo en cookie
  const csrfToken = generateCsrfToken();
  res.cookie('XSRF-TOKEN', csrfToken, { httpOnly: false, secure: false, sameSite: 'lax' });
  res.sendFile(path.join(process.cwd(), 'public', 'admin', 'login.html'));
});

// API routes - all under /api prefix
const apiRoutes = require('./api');
router.use('/api', apiRoutes);

// Admin API routes - all under /adm prefix
const adminRoutes = require('./admin');
router.use('/adm', adminRoutes);

router.get('/api/_ok', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
