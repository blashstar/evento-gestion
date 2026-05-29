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
  body('nombre')
    .trim()
    .notEmpty().withMessage('Nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .custom((value) => {
      if (!/^[\p{L}\s]+$/u.test(value)) {
        throw new Error('Nombre solo puede contener letras y espacios');
      }
      return true;
    }),
  body('celular')
    .trim()
    .notEmpty().withMessage('Celular es requerido')
    .isLength({ min: 7, max: 20 }).withMessage('Celular debe tener entre 7 y 20 caracteres')
    .isNumeric().withMessage('Celular debe contener solo números'),
  body('correo')
    .trim()
    .notEmpty().withMessage('Correo es requerido')
    .isEmail().withMessage('Debe ser un correo válido')
    .normalizeEmail({ gmail_remove_subaddress: false }),
  body('empresa')
    .trim()
    .notEmpty().withMessage('Empresa es requerida')
    .isLength({ min: 2, max: 200 }).withMessage('Empresa debe tener entre 2 y 200 caracteres'),
  body('especialidad')
    .trim()
    .notEmpty().withMessage('Especialidad es requerida')
    .isLength({ min: 2, max: 100 }).withMessage('Especialidad debe tener entre 2 y 100 caracteres')
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

    const { nombre, celular, correo, empresa, especialidad } = req.body;

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
    
    // Generar QR code
    let qrDataUrl;
    try {
      qrDataUrl = await QRCode.toDataURL(tokenValidacion);
    } catch (qrError) {
      console.error('Error al generar código QR:', qrError);
      return res.status(500).json({
        success: false,
        error: 'Error al generar código QR',
        mensaje: process.env.NODE_ENV === 'development' ? qrError.message : undefined
      });
    }

    const asistente = await Asistente.create({
      nombre,
      celular,
      correo,
      empresa,
      especialidad,
      token_validacion: tokenValidacion,
      qr_codigo: qrDataUrl
    });

    try {
      await emailService.enviarQR({
        nombre: asistente.nombre,
        correo: asistente.correo,
        qrDataUrl: qrDataUrl,
        tokenValidacion: tokenValidacion,
        celular: asistente.celular,
        empresa: asistente.empresa,
        especialidad: asistente.especialidad
      });
    } catch (emailError) {
      console.error('Error al enviar correo:', emailError);
      // No fallar el registro si el email falla
    }

    res.status(201).json({
      success: true,
      mensaje: 'Registro exitoso. Se ha enviado un correo con tu código QR.',
      data: {
        id: asistente.id,
        nombre: asistente.nombre,
        celular: asistente.celular,
        correo: asistente.correo,
        empresa: asistente.empresa,
        especialidad: asistente.especialidad,
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
        nombre: asistente.nombre,
        celular: asistente.celular,
        correo: asistente.correo,
        empresa: asistente.empresa,
        especialidad: asistente.especialidad,
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
          nombre: asistente.nombre,
          celular: asistente.celular,
          empresa: asistente.empresa,
          especialidad: asistente.especialidad,
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
        nombre: asistente.nombre,
        celular: asistente.celular,
        empresa: asistente.empresa,
        especialidad: asistente.especialidad,
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
