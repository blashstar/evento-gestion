# AGENTS.md - Guías para Agentes de Desarrollo

## Visión General del Proyecto

Aplicación de gestión de eventos para Deferol con:
- Registro de asistentes
- Generación y envío de códigos QR por email
- Panel administrativo para control de ingreso
- Despliegue vía Docker en Easypanel

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend | Node.js + Express |
| Base de datos | MySQL |
| ORM | Sequelize + Sequelize CLI |
| Autenticación | JWT (jsonwebtoken) |
| QR | qrcode (npm) |
| Email | Nodemailer |
| Frontend | HTML/CSS/JS vanilla (archivos existentes en ref/) |
| Contenedores | Docker + Docker Compose |

## Comandos de Build/Test/Lint

```bash
# Instalación de dependencias
npm install

# Desarrollo con hot-reload
npm run dev

# Producción
npm start

# Migraciones de base de datos
npm run migrate          # Aplicar migraciones pendientes
npm run migrate:undo     # Revertir última migración

# Crear nueva migración
npx sequelize-cli migration:generate --name nombre-migracion

# Tests (cuando se implementen)
npm test                 # Ejecutar todos los tests
npm test -- archivo.test.js  # Ejecutar test específico
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con reporte de cobertura

# Docker
docker-compose up                # Levantar entorno de desarrollo
docker-compose up --build        # Reconstruir y levantar
docker-compose down              # Detener contenedores
docker-compose down -v           # Detener y eliminar volúmenes

# Linting (configurar con ESLint)
npm run lint            # Verificar estilo de código
npm run lint:fix        # Corregir errores automáticamente
```

## Estructura del Proyecto

```
evento-Deferol/
├── models/              # Modelos Sequelize
│   ├── index.js         # Conexión y exportación de modelos
│   └── asistente.js     # Modelo de asistente
├── migrations/          # Migraciones versionadas
├── controllers/         # Lógica de negocio
├── routes/              # Definición de endpoints
│   └── index.js         # Router principal
├── middleware/          # Middleware personalizado
│   └── auth.js          # Validación JWT
├── services/           # Lógica reutilizable
│   ├── email.js        # Servicio de envío de correos
│   └── qr.js           # Generación de QR
├── config/             # Configuración
│   ├── config.js       # Config para Sequelize CLI
│   └── database.js     # Config de conexión
├── public/             # Archivos estáticos (HTML/CSS/JS frontend)
├── .env.example        # Template de variables de entorno
├── Dockerfile          # Imagen de la aplicación
├── docker-compose.yml  # Orquestación local
├── entrypoint.sh       # Script de inicio del contenedor
├── package.json
└── server.js           # Punto de entrada
```

## Convenciones de Código

### Imports y Requeridos

```javascript
// Orden de imports:
// 1. Módulos de Node.js
// 2. Paquetes npm
// 3. Módulos locales (models, controllers, services)
// 4. Archivos de configuración

// Node.js
const fs = require('fs');
const path = require('path');

// npm
const express = require('express');
const jwt = require('jsonwebtoken');

// Locales
const Asistente = require('./models').Asistente;
const emailService = require('./services/email');

// Config
const config = require('./config/config');
```

### Formato y Estilo

- **Indentación**: 2 espacios (no tabs)
- **Punto y coma**: Requeridos al final de cada sentencia
- **Comillas**: Single quotes para strings, double quotes para JSON/HTML
- **Longitud de línea**: Máximo 100 caracteres
- **Trailing commas**: No usar en objetos/arrays simple

**ESLint recomendado** (`.eslintrc.json`):
```json
{
  "env": { "node": true, "es2024": true },
  "extends": "eslint:recommended",
  "rules": {
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": ["error", 2],
    "max-len": ["error", { "code": 100 }],
    "no-console": "off"
  }
}
```

### Nombres y Convenciones

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos | kebab-case | `asistente-controller.js` |
| Variables/Funciones | camelCase | `enviarCorreo`, `listaAsistentes` |
| Constantes globales | UPPER_SNAKE_CASE | `JWT_SECRET`, `DB_HOST` |
| Clases/Modelos | PascalCase | `Asistente`, `Usuario` |
| Tablas BD | snake_case (plural) | `asistentes` |
| Endpoints API | kebab-case | `/api/asistentes` |
| Middlewares | camelCase | `verificarToken`, `validarCampos` |

### Tipos y Validaciones

```javascript
// Siempre validar tipos en endpoints
const { body, validationResult } = require('express-validator');

// Ejemplo de validación
const validarRegistro = [
  body('nombres')
    .notEmpty().withMessage('Nombres es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Nombres debe tener entre 2 y 100 caracteres'),
  body('correo')
    .isEmail().withMessage('Debe ser un correo válido')
    .normalizeEmail(),
  body('empresa')
    .notEmpty().withMessage('Empresa es requerida'),
];
```

### Manejo de Errores

```javascript
// Patrón async/await con try/catch
async function crearAsistente(req, res) {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const asistente = await Asistente.create(req.body);
    res.status(201).json(asistente);
  } catch (error) {
    console.error('Error al crear asistente:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      mensaje: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Middleware de errores global
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
}
```

### Convenciones de API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/registro` | Registrar nuevo asistente |
| GET | `/api/validar/:token` | Validar correo (envía QR) |
| POST | `/api/admin/login` | Login administrador |
| GET | `/api/admin/asistentes` | Listar asistentes (auth) |
| POST | `/api/admin/ingreso` | Registrar ingreso por QR (auth) |

**Formato de respuesta estándar**:
```javascript
// Éxito
{ "success": true, "data": {...}, "mensaje": "Operación exitosa" }

// Error
{ "success": false, "error": "Descripción del error", "errores": [...] }
```

## Convenciones de Sequelize

### Modelos

```javascript
// models/asistente.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Asistente = sequelize.define('Asistente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    correo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    empresa: {
      type: DataTypes.STRING(200),
      allowNull: false
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
      defaultValue: 'pendiente'
    },
    fecha_registro: {
      type: DataTypes.DATE,
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
      { unique: true, fields: ['correo'] }
    ]
  });

  return Asistente;
};
```

### Migraciones

```javascript
// migrations/YYYYMMDDHHMMSS-create-asistentes.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('asistentes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombres: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      // ... resto de campos
      creado_en: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
    
    await queryInterface.addIndex('asistentes', ['correo'], {
      unique: true,
      name: 'asistentes_correo_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('asistentes');
  }
};
```

## Convenciones de Git

### Mensajes de Commit (en español)

Seguir formato [Conventional Commits](https://www.conventionalcommits.org/) pero en español:

```
<tipo>: <descripción>

[opcional body]

[opcional footer]
```

**Tipos permitidos**:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de errores
- `refactor`: Cambios de código sin modificar funcionalidad
- `docs`: Actualización de documentación
- `test`: Adición/modificación de tests
- `chore`: Tareas de mantenimiento
- `style`: Cambios de formato (no afectan lógica)
- `perf`: Mejoras de rendimiento

**Ejemplos**:
```bash
feat: agregar generación de código QR para asistentes
fix: corregir validación de email duplicado en registro
refactor: extraer lógica de email a servicio independiente
docs: actualizar README con instrucciones de Docker
chore: configurar ESLint y Prettier
test: agregar tests para endpoint de registro
```

### Branches

- `main` o `master`: Producción estable
- `develop`: Integración de features
- `feature/<nombre>`: Nuevas funcionalidades
- `fix/<nombre>`: Correcciones de errores
- `hotfix/<nombre>`: Parches urgentes en producción

## Variables de Entorno

```bash
# .env.example - NUNCA commitear .env real
NODE_ENV=development

# Servidor
PORT=3000

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=evento_db
DB_USER=root
DB_PASS=secret

# JWT
JWT_SECRET=clave_super_secreta_minimo_32_caracteres
JWT_EXPIRES_IN=24h

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_app_password

# URLs
BASE_URL=http://localhost:3000

# Admin fijo
ADMIN_USER=admin
ADMIN_PASS=admin123
```

## Seguridad

### Nunca hardcodear secretos
```javascript
// MAL
const jwtSecret = 'mi_clave_secreta';

// BIEN
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET no definido');
```

### Validar entrada de usuario
- Siempre sanitizar inputs con `express-validator`
- Usar prepared statements (Sequelize lo hace automáticamente)
- No confiar en datos del cliente

### Headers de seguridad
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### Rate limiting
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite por IP
  message: 'Demasiadas solicitudes, intenta más tarde'
});
app.use('/api/', limiter);
```

## Docker y Despliegue

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### entrypoint.sh
```bash
#!/bin/sh
npx sequelize-cli db:migrate
npm start
```

### Flujo de trabajo Docker
1. Desarrollo: `docker-compose up` (monta código local)
2. Build producción: `docker build -t evento-app .`
3. Despliegue Easypanel: Usar imagen del registro (GHCR)

## Testing

### Estructura de tests
```
tests/
├── unit/
│   └── services/
│       ├── email.test.js
│       └── qr.test.js
└── integration/
    └── routes/
        ├── registro.test.js
        └── admin.test.js
```

### Test template
```javascript
const request = require('supertest');
const app = require('../server');

describe('POST /api/registro', () => {
  it('debería registrar un asistente válido', async () => {
    const res = await request(app)
      .post('/api/registro')
      .send({
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo: 'juan@example.com',
        empresa: 'Acme'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });
});
```

## Estado Actual del Proyecto (Revisión 2026-05-29)

### Tests
- **Unit tests:** 11 tests para modelo Asistente, todos pasan (usando SQLite en memoria)
- **E2E tests:** Playwright con cobertura de landing, registro, validación QR, admin y API
- **Linting:** ESLint pasa limpio

### Problemas Resueltos
- Tests unitarios migrados de MySQL a SQLite en memoria (no requieren DB externa)
- ESLint configurado para ignorar `public/vendor/`
- Errores de estilo corregidos en `admin.js` y tests e2e

### Pendientes Críticos
- Revisar 15 vulnerabilidades npm (`npm audit`)
- Crear archivo `.env` desde `.env.example`
- Cambiar branding del proyecto (ver `REVISION.md` plan de rebranding)

### Dependencias Instaladas
- `sqlite3` agregado como devDependency para tests unitarios

## Notas importantes

- Archivos estáticos del frontend ya existen en `ref/` - adaptar para consumir API
- El QR debe generarse como base64 para incrustar en HTML del email
- Usar Umzug para migraciones automáticas en desarrollo
- En producción, Easypanel maneja las variables de entorno
- Todos los commits deben ser en español