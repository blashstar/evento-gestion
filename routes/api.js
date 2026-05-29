const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { Asistente } = require('../models');
const emailService = require('../services/email');

const router = express.Router();

/**
 * POST /api/registro
 * Registra un nuevo asistente al evento
 */
router.post('/registro', [
  body('nombres')
    .trim()
    .notEmpty().withMessage('Nombres es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Nombres debe tener entre 2 y 100 caracteres')
    .custom((value) => {
      if (!/^[\p{L}\s]+$/u.test(value)) {
        throw new Error('Nombres solo puede contener letras y espacios');
      }
      return true;
    }),
  body('apellidos')
    .trim()
    .notEmpty().withMessage('Apellidos es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Apellidos debe tener entre 2 y 100 caracteres')
    .custom((value) => {
      if (!/^[\p{L}\s]+$/u.test(value)) {
        throw new Error('Apellidos solo puede contener letras y espacios');
      }
      return true;
    }),
  body('correo')
    .trim()
    .notEmpty().withMessage('Correo es requerido')
    .isEmail().withMessage('Debe ser un correo válido')
    .normalizeEmail({ gmail_remove_subaddress: false }),
  body('empresa')
    .trim()
    .notEmpty().withMessage('Empresa es requerida')
    .isLength({ min: 2, max: 200 }).withMessage('Empresa debe tener entre 2 y 200 caracteres')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        errores: errores.array().map(e => ({
          campo: e.path,
          mensaje: e.msg
        }))
      });
    }

    const { nombres, apellidos, correo, empresa } = req.body;

    const existente = await Asistente.findOne({ where: { correo } });
    if (existente) {
      return res.status(409).json({
        success: false,
        errores: [{
          campo: 'correo',
          mensaje: 'Este correo ya está registrado'
        }]
      });
    }

    const tokenValidacion = crypto.randomUUID();
    const qrDataUrl = await QRCode.toDataURL(tokenValidacion);

    const asistente = await Asistente.create({
      nombres,
      apellidos,
      correo,
      empresa,
      token_validacion: tokenValidacion,
      qr_codigo: qrDataUrl
    });

    try {
      await emailService.enviarQR({
        nombres: asistente.nombres,
        apellidos: asistente.apellidos,
        correo: asistente.correo,
        qrDataUrl: qrDataUrl,
        tokenValidacion: tokenValidacion
      });
    } catch (emailError) {
      console.error('Error al enviar correo:', emailError);
    }

    res.status(201).json({
      success: true,
      mensaje: 'Registro exitoso. Se ha enviado un correo con tu código QR.',
      data: {
        id: asistente.id,
        nombres: asistente.nombres,
        apellidos: asistente.apellidos,
        correo: asistente.correo,
        empresa: asistente.empresa,
        qrCodigo: qrDataUrl,
        estado: asistente.estado
      }
    });
  } catch (error) {
    console.error('Error al registrar asistente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      mensaje: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/validar/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const asistente = await Asistente.findOne({
      where: { token_validacion: token }
    });

    if (!asistente) {
      return res.status(404).json({
        success: false,
        error: 'Token de validación no encontrado'
      });
    }

    if (asistente.estado === 'validado' || asistente.estado === 'ingresado') {
      return res.status(400).json({
        success: false,
        error: 'Este asistente ya ha sido validado'
      });
    }

    asistente.estado = 'validado';
    await asistente.save();

    res.json({
      success: true,
      mensaje: 'Correo validado exitosamente',
      data: {
        nombres: asistente.nombres,
        apellidos: asistente.apellidos,
        correo: asistente.correo,
        empresa: asistente.empresa,
        estado: asistente.estado
      }
    });
  } catch (error) {
    console.error('Error al validar token:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});


/**
 * POST /api/ingreso
 * Valida un QR de ingreso al evento (para kiosko)
 * Recibe un UUID y devuelve los datos del asistente sin correo
 */
router.post('/ingreso', async (req, res) => {
  try {
    const { token } = req.body;

    // Validar que sea un UUID valido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!token || !uuidRegex.test(token)) {
      return res.status(400).json({
        success: false,
        error: 'Token no valido. Debe ser un UUID.'
      });
    }

    const asistente = await Asistente.findOne({
      where: { token_validacion: token }
    });

    if (!asistente) {
      return res.status(404).json({
        success: false,
        error: 'Codigo QR no encontrado en el sistema'
      });
    }

    if (asistente.estado === 'ingresado') {
      return res.status(401).json({
        success: false,
        status: 401,
        error: 'Este asistente YA INGRESO al evento',
        data: {
          uuid: asistente.token_validacion,
          nombres: asistente.nombres,
          apellidos: asistente.apellidos,
          empresa: asistente.empresa,
          fechaIngreso: asistente.fecha_ingreso
        }
      });
    }

    // Registrar ingreso
    asistente.estado = 'ingresado';
    asistente.fecha_ingreso = new Date();
    await asistente.save();

    res.json({
      success: true,
      mensaje: 'Ingreso registrado exitosamente',
      data: {
        uuid: asistente.token_validacion,
        nombres: asistente.nombres,
        apellidos: asistente.apellidos,
        empresa: asistente.empresa,
        estado: asistente.estado,
        fechaIngreso: asistente.fecha_ingreso
      }
    });
  } catch (error) {
    console.error('Error al validar ingreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
