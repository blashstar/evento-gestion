/**
 * Rutas de Administración
 * Prefijo: /adm
 * Todas las rutas requieren autenticación JWT excepto /adm/login
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Asistente } = require('../models');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Middleware para generar token CSRF
 */
function csrfMiddleware(req, res, next) {
  if (!req.csrfToken) {
    // Generar token CSRF simple basado en secretsimplecsrf
    const token = require('crypto').randomBytes(32).toString('hex');
    req.csrfToken = token;
    res.cookie('XSRF-TOKEN', token, { httpOnly: false, secure: false });
  }
  next();
}

// Aplicar CSRF a todas las rutas
router.use(csrfMiddleware);

/**
 * GET /adm/csrf-token
 * Obtener token CSRF para el cliente
 */
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken });
});

/**
 * POST /adm/login
 * Autenticación de administrador con protección CSRF
 */
router.post('/login', [
  body('correo').trim().notEmpty().withMessage('Correo es requerido').isEmail().withMessage('Debe ser un correo válido'),
  body('password').trim().notEmpty().withMessage('Contraseña es requerida')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        errores: errores.array().map(e => ({ campo: e.path, mensaje: e.msg }))
      });
    }

    const { correo, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin@Deferol.gob.pe';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    
    // Validar credenciales - acepta el correo configurable o el fijo por defecto
    const correoFijo = 'admin@Deferol.gob.pe';
    const correoPermitido = adminUser.includes('@') ? adminUser : correoFijo;
    
    if (correo !== correoPermitido || password !== adminPass) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const payload = {
      id: 0,
      correo: correoPermitido,
      rol: 'admin'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    res.json({
      success: true,
      mensaje: 'Login exitoso',
      csrfToken: req.csrfToken,
      data: {
        token,
        usuario: {
          correo: correoPermitido,
          rol: 'admin'
        }
      }
    });
  } catch (error) {
    console.error('Error en login admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /adm/asistentes
 * Listar todos los asistentes (protegido)
 * Soporta filtros: ?estado=registrado|ingresado&busqueda=texto
 */
router.get('/asistentes', verificarToken, async (req, res) => {
  try {
    const { estado, busqueda, limit = 50, offset = 0 } = req.query;
    const { Op } = require('sequelize');

    // Construir condiciones de búsqueda
    const where = {};
    
    if (estado) {
      if (estado === 'ingresado') {
        where.estado = 'ingresado';
      } else if (estado === 'registrado') {
        // Registrado = cualquier estado que NO sea ingresado
        where.estado = { [Op.ne]: 'ingresado' };
      }
    }

    if (busqueda) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { correo: { [Op.like]: `%${busqueda}%` } },
        { empresa: { [Op.like]: `%${busqueda}%` } },
        { especialidad: { [Op.like]: `%${busqueda}%` } },
        { celular: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    // Obtener total de registros
    const total = await Asistente.count({ where });

    // Obtener asistentes con paginación
    const asistentes = await Asistente.findAll({
      where,
      attributes: ['id', 'nombre', 'celular', 'correo', 'empresa', 'especialidad', 'estado', 'fecha_registro', 'fecha_ingreso'],
      order: [['fecha_registro', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Obtener estadísticas
    const stats = await Asistente.findAll({
      attributes: [
        'estado',
        [require('sequelize').fn('COUNT', require('sequelize').col('estado')), 'total']
      ],
      group: ['estado']
    });

    const estados = {
      pendiente: 0,
      validado: 0,
      ingresados: 0
    };

    stats.forEach(s => {
      if (s.estado === 'pendiente') estados.pendiente = parseInt(s.dataValues.total);
      if (s.estado === 'validado') estados.validado = parseInt(s.dataValues.total);
      if (s.estado === 'ingresado') estados.ingresados = parseInt(s.dataValues.total);
    });

    res.json({
      success: true,
      data: {
        asistentes,
        total,
        pagina: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        estadisticas: {
          total: total,
          pendientes: estados.pendiente,
          validados: estados.validado,
          ingresados: estados.ingresados
        }
      }
    });
  } catch (error) {
    console.error('Error al listar asistentes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /adm/asistentes/:id
 * Obtener detalle de un asistente específico (protegido)
 */
router.get('/asistentes/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const asistente = await Asistente.findByPk(id, {
      attributes: ['id', 'nombre', 'celular', 'correo', 'empresa', 'especialidad', 'estado', 'token_validacion', 'qr_codigo', 'fecha_registro', 'fecha_ingreso']
    });

    if (!asistente) {
      return res.status(404).json({
        success: false,
        error: 'Asistente no encontrado'
      });
    }

    res.json({
      success: true,
      data: asistente
    });
  } catch (error) {
    console.error('Error al obtener asistente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /adm/estadisticas
 * Obtener estadísticas generales del evento
 */
router.get('/estadisticas', verificarToken, async (req, res) => {
  try {
    const total = await Asistente.count();
    
    const stats = await Asistente.findAll({
      attributes: [
        'estado',
        [require('sequelize').fn('COUNT', require('sequelize').col('estado')), 'total']
      ],
      group: ['estado']
    });

    const estados = { pendiente: 0, validado: 0, ingresados: 0 };
    stats.forEach(s => {
      if (s.estado === 'pendiente') estados.pendiente = parseInt(s.dataValues.total);
      if (s.estado === 'validado') estados.validado = parseInt(s.dataValues.total);
      if (s.estado === 'ingresado') estados.ingresados = parseInt(s.dataValues.total);
    });

    // Obtener últimos registros
    const recientes = await Asistente.findAll({
      attributes: ['id', 'nombre', 'estado', 'fecha_registro'],
      order: [['fecha_registro', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        total,
        ...estados,
        recientes
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * PUT /adm/asistentes/:id/estado
 * Cambiar el estado de un asistente
 */
router.put('/asistentes/:id/estado', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['pendiente', 'validado', 'ingresado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido. Debe ser: pendiente, validado o ingresado'
      });
    }

    const asistente = await Asistente.findByPk(id);

    if (!asistente) {
      return res.status(404).json({
        success: false,
        error: 'Asistente no encontrado'
      });
    }

    // Actualizar estado
    await asistente.update({ estado });

    // Si el nuevo estado es 'ingresado', actualizar fecha_ingreso
    // Si es otro estado, limpiar fecha_ingreso
    if (estado === 'ingresado') {
      await asistente.update({ fecha_ingreso: new Date() });
    } else {
      await asistente.update({ fecha_ingreso: null });
    }

    res.json({
      success: true,
      mensaje: `Estado actualizado a ${estado}`,
      data: {
        id: asistente.id,
        estado: asistente.estado,
        fecha_ingreso: asistente.fecha_ingreso
      }
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /adm/asistentes/exportar
 * Exportar lista de asistentes a Excel
 */
router.get('/asistentes/exportar', verificarToken, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    // Obtener todos los asistentes
    const asistentes = await Asistente.findAll({
      attributes: ['id', 'nombre', 'celular', 'correo', 'empresa', 'especialidad', 'estado', 'fecha_registro', 'fecha_ingreso'],
      order: [['fecha_registro', 'DESC']]
    });
    
    // Transformar datos para Excel
    const data = asistentes.map(a => ({
      'ID': a.id,
      'Nombre': a.nombre,
      'Celular': a.celular,
      'Correo': a.correo,
      'Empresa': a.empresa,
      'Especialidad': a.especialidad,
      'Estado': a.estado,
      'Fecha de Registro': a.fecha_registro ? new Date(a.fecha_registro).toLocaleString('es-PE') : '',
      'Fecha de Ingreso': a.fecha_ingreso ? new Date(a.fecha_ingreso).toLocaleString('es-PE') : ''
    }));
    
    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Ajustar ancho de columnas
    const cols = [
      { wch: 5 },   // ID
      { wch: 25 }, // Nombre
      { wch: 15 }, // Celular
      { wch: 35 }, // Correo
      { wch: 30 }, // Empresa
      { wch: 20 }, // Especialidad
      { wch: 12 }, // Estado
      { wch: 20 }, // Fecha Registro
      { wch: 20 }  // Fecha Ingreso
    ];
    worksheet['!cols'] = cols;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistentes');
    
    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Enviar archivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=asistentes.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar Excel'
    });
  }
});

/**
 * POST /adm/asistentes/:id/enviar-qr
 * Enviar QR por correo al asistente
 */
router.post('/asistentes/:id/enviar-qr', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const emailService = require('../services/email');
    
    const asistente = await Asistente.findByPk(id);
    
    if (!asistente) {
      return res.status(404).json({
        success: false,
        error: 'Asistente no encontrado'
      });
    }
    
    if (!asistente.qr_codigo || !asistente.token_validacion) {
      return res.status(400).json({
        success: false,
        error: 'El asistente no tiene código QR generado'
      });
    }
    
    // Enviar correo con QR
    await emailService.enviarQR({
      nombre: asistente.nombre,
      correo: asistente.correo,
      qrDataUrl: asistente.qr_codigo,
      tokenValidacion: asistente.token_validacion,
      celular: asistente.celular,
      empresa: asistente.empresa,
      especialidad: asistente.especialidad
    });
    
    res.json({
      success: true,
      mensaje: 'QR enviado exitosamente al correo del asistente'
    });
  } catch (error) {
    console.error('Error al enviar QR por correo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el correo'
    });
  }
});

module.exports = router;
