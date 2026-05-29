'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asistentes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      celular: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      correo: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      empresa: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      especialidad: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      token_validacion: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      qr_codigo: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'validado', 'ingresado'),
        defaultValue: 'pendiente',
        allowNull: false
      },
      fecha_registro: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      fecha_ingreso: {
        type: Sequelize.DATE,
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('asistentes', ['correo'], {
      unique: true,
      name: 'asistentes_correo_unique'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('asistentes');
  }
};
