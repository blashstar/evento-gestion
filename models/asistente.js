'use strict';
const validator = require('validator');

module.exports = (sequelize, DataTypes) => {
  const Asistente = sequelize.define('Asistente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nombre es requerido'
        },
        len: {
          args: [2, 100],
          msg: 'Nombre debe tener entre 2 y 100 caracteres'
        }
      }
    },
    celular: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Celular es requerido'
        },
        len: {
          args: [7, 20],
          msg: 'Celular debe tener entre 7 y 20 caracteres'
        }
      }
    },
    correo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Debe ser un correo válido'
        },
        notEmpty: {
          msg: 'Correo es requerido'
        }
      }
    },
    empresa: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Empresa es requerida'
        }
      }
    },
    especialidad: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Especialidad es requerida'
        }
      }
    },
    token_validacion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    qr_codigo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'validado', 'ingresado'),
      defaultValue: 'pendiente',
      allowNull: false
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_ingreso: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'asistentes',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['correo'],
        name: 'asistentes_correo_unique'
      }
    ],
    hooks: {
      beforeValidate: (asistente) => {
        // Normalizar correo antes de ejecutar las validaciones
        if (asistente.correo) {
          asistente.correo = validator.normalizeEmail(asistente.correo.trim(), {
          // Preservar subdirecciones de Gmail (ej: usuario+evento@gmail.com)
            gmail_remove_subaddress: false
          });
        }
      }
    }
  });

  return Asistente;
};
