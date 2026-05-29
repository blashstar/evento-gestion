# PRD Extendido: Aplicación de Gestión de Eventos con Registro, QR, Control de Ingreso y Despliegue Dockerizado

## 1. Introducción y Objetivos

(Se mantiene igual que en la versión anterior, pero se añade el objetivo de **despliegue en Easypanel** mediante contenedores Docker.)

**Nuevo objetivo específico**  
- La aplicación debe ser empaquetada en contenedores Docker para facilitar el despliegue en servidores Easypanel y garantizar entornos consistentes entre desarrollo y producción.

---

## 2. Decisiones Técnicas y Tecnologías (ampliado)

| Componente          | Elección                                                                 | Justificación                                                                                     |
|---------------------|--------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| **Backend**         | Node.js + Express                                                        | Código JavaScript unificado, fácil integración.                                                   |
| **Base de datos**   | MySQL                                                                    | Requisito explícito.                                                                              |
| **ORM**             | Sequelize                                                                | Soporte para migraciones incrementales, ideal para cambios entre entornos.                        |
| **Autenticación**   | JWT (JSON Web Tokens)                                                    | Stateless, seguro y fácil de implementar.                                                         |
| **Generación QR**   | `qrcode` (npm)                                                           | Ligera y produce base64 listo para email y web.                                                    |
| **Envío de correos**| Nodemailer                                                               | Flexible con SMTP.                                                                                |
| **Escaneo QR**      | `html5-qrcode` (opcional)                                                | Permite escaneo desde cámara en el panel admin.                                                    |
| **Frontend**        | HTML/CSS existentes + JavaScript nativo (fetch API)                      | Reutilización de formularios ya diseñados.                                                         |
| **Contenedorización**| Docker + Docker Compose                                                  | Empaquetado de la app y la base de datos. Facilita despliegue en Easypanel.                       |
| **Migraciones**     | Sequelize CLI                                                            | Migraciones versionadas para aplicar cambios en BD de forma controlada.                           |
| **Repositorio**     | GitHub                                                                   | Control de versiones; uso de `gh` CLI para crear y subir el código.                               |
| **Despliegue**      | Easypanel                                                                | Panel de control que orquesta contenedores Docker con Traefik.                                    |

**Variables de entorno (.env)** – se amplía con variables de Docker.  
```bash
# Entorno (development, production)
NODE_ENV=development

# Servidor
PORT=3000

# Base de datos (para desarrollo local usar servicio MySQL del docker-compose)
DB_HOST=mysql
DB_PORT=3306
DB_NAME=evento_db
DB_USER=root
DB_PASS=secret

# JWT
JWT_SECRET=clave_super_secreta

# Correo (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=correo@example.com
SMTP_PASS=contraseña_app

# URL pública para enlaces de validación (en desarrollo: http://localhost:3000)
BASE_URL=http://localhost:3000

# Credenciales admin (fijas)
ADMIN_USER=admin
ADMIN_PASS=admin123
```

---

## 3. Flujos de Uso (sin cambios, igual que antes)

---

## 4. Especificaciones de Módulos (actualizado con migraciones y Docker)

### 4.1 Modelo de Datos (Sequelize) y Migraciones

**Tabla: `asistentes`** (definición en modelo)  
Se mantiene igual que en la versión anterior. Además, se creará una **migración inicial** para crear la tabla.

**Estructura de migraciones** (usando Sequelize CLI):
- `migrations/20250101000000-create-asistentes.js`
- `migrations/20250101000001-add-algun-campo.js` (ejemplo de futura modificación)

**Comandos para migraciones**:
- `npx sequelize-cli db:migrate` (aplica migraciones pendientes)
- `npx sequelize-cli db:migrate:undo` (revierte última migración)

**Archivo de configuración de Sequelize** (`config/config.js`):
```javascript
require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
  }
};
```

### 4.2 Empaquetado Docker

#### Dockerfile para la aplicación Node.js
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### docker-compose.yml para desarrollo local
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8
    container_name: evento_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: evento_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - evento_net

  app:
    build: .
    container_name: evento_app
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - mysql
    environment:
      NODE_ENV: development
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: evento_db
      DB_USER: root
      DB_PASS: secret
      JWT_SECRET: clave_super_secreta
      BASE_URL: http://localhost:3000
      ADMIN_USER: admin
      ADMIN_PASS: admin123
      # Variables de correo (se deben pasar en entorno real)
    networks:
      - evento_net
    volumes:
      - ./:/app
      - /app/node_modules

networks:
  evento_net:

volumes:
  mysql_data:
```

**Nota**: En producción (Easypanel), se usará un archivo `docker-compose.yml` similar pero sin montar el código fuente localmente, usando imágenes desde un registro (por ejemplo, GitHub Container Registry) y con las variables de entorno inyectadas por Easypanel.

### 4.3 Scripts de inicio y migraciones automáticas

En `package.json` se deben definir scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "migrate": "npx sequelize-cli db:migrate",
    "migrate:undo": "npx sequelize-cli db:migrate:undo",
    "dev": "nodemon server.js"
  }
}
```

En el archivo principal `server.js`, se debe ejecutar la migración automáticamente antes de iniciar el servidor (solo en desarrollo) o mediante un script de inicio en producción.

**Ejemplo en server.js**:
```javascript
const { sequelize } = require('./models');
const migrator = async () => {
  if (process.env.NODE_ENV === 'development') {
    // Opcional: ejecutar migraciones en desarrollo automáticamente
    const { Umzug, SequelizeStorage } = require('umzug');
    const umzug = new Umzug({
      migrations: { glob: 'migrations/*.js' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });
    await umzug.up();
  }
};
// Llamar antes de iniciar servidor
```

### 4.4 Despliegue en Easypanel

Easypanel usa contenedores Docker y orquesta con Traefik. Se debe crear un **proyecto** en Easypanel que contenga dos servicios:
- `mysql` (usando imagen oficial)
- `app` (usando la imagen construida desde el repositorio)

**Configuración típica en Easypanel** (a través de su UI o archivo `docker-compose.yml`):
- Se definen las variables de entorno correspondientes (producción).
- Se configura el dominio y el puerto expuesto (Traefik se encarga del proxy).
- Se asegura que las migraciones se ejecuten al inicio del contenedor app (por ejemplo, usando un script de entrada).

**Recomendación**: Incluir un script `entrypoint.sh` que ejecute las migraciones y luego inicie la aplicación.

```bash
#!/bin/sh
npx sequelize-cli db:migrate
npm start
```

Luego en Dockerfile:
```dockerfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

---

## 5. Gestión del Repositorio con GitHub CLI (en español)

### 5.1 Creación del repositorio y subida inicial

Se utilizará la herramienta `gh` (GitHub CLI) para crear el repositorio, hacer el primer commit y subirlo. Todos los mensajes de commit deben estar en español.

**Pasos a ejecutar** (desde la máquina local):

1. Inicializar repositorio local:
   ```bash
   git init
   git add .
   git commit -m "feat: estructura inicial de la aplicación"
   ```

2. Crear repositorio en GitHub con `gh`:
   ```bash
   gh repo create evento-app --public --source=. --remote=origin --push
   ```
   (si ya existe, se puede usar `gh repo create --public --push`)

3. Asegurarse de que el repositorio tiene los archivos correctos (incluir `.gitignore` con `node_modules`, `.env`, etc.).

### 5.2 Convención de commits en español

Se recomienda usar el formato:
- `feat: descripción en español`
- `fix: corrección de algo`
- `docs: actualización de documentación`
- `chore: tareas de mantenimiento`
- `refactor: cambio de código sin modificar funcionalidad`

Ejemplo:
```bash
git commit -m "feat: agregar migración inicial para tabla asistentes"
git commit -m "fix: corregir validación de email duplicado en registro"
```

### 5.3 Flujo de trabajo con GitHub Actions (opcional)

Para automatizar pruebas y despliegue, se puede agregar un workflow de GitHub Actions que:
- Ejecute migraciones en base de datos de prueba.
- Construya la imagen Docker.
- La suba a GitHub Container Registry (GHCR) para que Easypanel la consuma.

---

## 6. Requisitos No Funcionales (ampliados)

- **Migraciones**:  
  - Todas las modificaciones al esquema de base de datos deben realizarse mediante migraciones de Sequelize, versionadas y almacenadas en el repositorio.  
  - Las migraciones deben ser **incrementales**, permitiendo aplicar cambios hacia adelante y hacia atrás (up/down) para facilitar el desarrollo y producción.

- **Despliegue**:  
  - La aplicación debe ser desplegable en Easypanel usando Docker Compose o imagen preconstruida.  
  - El entorno de desarrollo local debe usar `docker-compose up` para levantar tanto la base de datos como la aplicación en modo desarrollo (con montaje de código).  
  - El entorno de producción debe usar una imagen construida desde el repositorio y las variables de entorno inyectadas por Easypanel.

- **Seguridad**:  
  - Las credenciales de base de datos, JWT, correo y admin se deben pasar exclusivamente mediante variables de entorno, nunca hardcodeadas.  
  - En desarrollo, las credenciales pueden estar en `.env` (ignorado por git).  
  - En producción, Easypanel maneja secretos.

- **Documentación**:  
  - Se debe incluir un archivo `README.md` en español con instrucciones para:  
    - Levantar el entorno local con Docker Compose.  
    - Ejecutar migraciones manualmente.  
    - Construir imagen Docker.  
    - Desplegar en Easypanel.

---

## 7. Plan de Implementación (ajustado)

1. **Preparar entorno local**  
   - Crear archivos `Dockerfile`, `docker-compose.yml`, `.env.example`.  
   - Configurar Sequelize y migración inicial.

2. **Implementar lógica de backend**  
   - Endpoints de registro, validación, admin.  
   - Integrar generador de QR y correo.

3. **Integrar frontend**  
   - Adaptar formularios existentes para consumir API.

4. **Crear repositorio y subir código**  
   - Usar `gh` para crear repositorio en GitHub.  
   - Hacer commits con mensajes en español.

5. **Probar entorno local con Docker**  
   - Ejecutar `docker-compose up` y verificar que la app y la BD funcionan.

6. **Configurar migraciones automáticas**  
   - Asegurar que al iniciar el contenedor se ejecuten las migraciones.

7. **Preparar despliegue en Easypanel**  
   - Crear proyecto en Easypanel usando la imagen del repositorio (GHCR).  
   - Configurar variables de entorno y dominio.

8. **Documentar**  
   - Escribir `README.md` con todos los pasos.

---

## 8. Criterios de Aceptación (añadidos)

- ✅ La aplicación se empaqueta correctamente con Docker y se puede levantar localmente con `docker-compose up`.
- ✅ Las migraciones de base de datos se aplican automáticamente al iniciar el contenedor.
- ✅ El código está versionado en GitHub, con todos los mensajes de commit en español.
- ✅ Se puede desplegar en Easypanel sin modificaciones adicionales más allá de variables de entorno.
- ✅ El entorno de desarrollo local utiliza un contenedor MySQL independiente y la app se monta con hot-reload.

---

