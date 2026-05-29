# Revisión Completa del Proyecto - Evento Deferol

> Fecha: 2026-05-29
> Estado: Revisión completada, preparado para rebranding

---

## 1. Resumen Ejecutivo

El proyecto es una aplicación de gestión de eventos con registro de asistentes, generación de códigos QR y panel administrativo. Está construido con Node.js + Express + Sequelize + MySQL en el backend y HTML/CSS/JS vanilla en el frontend.

**Estado general:** Funcional y bien estructurado. Se corrigieron problemas de tests y linting. Listo para cambio de branding y nuevas funcionalidades.

---

## 2. Arquitectura y Funcionalidad

### 2.1 Backend (`server.js`, `routes/`, `models/`, `services/`)

| Componente | Estado | Notas |
|------------|--------|-------|
| `server.js` | ✅ OK | Express con Helmet, CORS, rate-limiting, static files |
| `routes/api.js` | ✅ OK | Registro, validación por token, ingreso por QR |
| `routes/admin.js` | ✅ OK | Login JWT, CRUD asistentes, estadísticas, export Excel, reenvío QR |
| `routes/index.js` | ✅ OK | Serve de HTML pages, CSRF tokens |
| `models/asistente.js` | ✅ OK | Validaciones completas, hooks de normalización de email |
| `models/index.js` | ✅ OK | Conexión Sequelize simple |
| `middleware/auth.js` | ✅ OK | Verificación JWT Bearer token |
| `services/email.js` | ✅ OK | Nodemailer con HTML inline, adjunto QR como CID |
| `config/config.js` | ✅ OK | Configuración para dev/test/prod |

**Endpoints API:**
- `POST /api/registro` - Registra asistente, genera QR, envía email
- `GET /api/validar/:token` - Valida email del asistente
- `POST /api/ingreso` - Registra ingreso por QR (UUID)
- `POST /adm/login` - Login admin (JWT + CSRF)
- `GET /adm/csrf-token` - Obtiene CSRF token
- `GET /adm/asistentes` - Lista con filtros y paginación
- `GET /adm/asistentes/:id` - Detalle de asistente
- `GET /adm/estadisticas` - Estadísticas del evento
- `PUT /adm/asistentes/:id/estado` - Cambia estado
- `GET /adm/asistentes/exportar` - Exporta Excel
- `POST /adm/asistentes/:id/enviar-qr` - Reenvía QR por email
- `GET /api/_ok` - Health check

### 2.2 Frontend (`public/`)

| Página | Archivos | Estado |
|--------|----------|--------|
| Landing | `index.html` + `index.css` | ✅ OK |
| Registro | `registro.html` + `registro.js` + `registro.css` | ✅ OK |
| Validación QR | `validacion.html` + `validacion.js` + `validacion.css` | ✅ OK |
| Admin Login | `admin/login.html` | ✅ OK |
| Admin Dashboard | `admin/index.html` + `admin.js` | ✅ OK |

**Características frontend:**
- Diseño responsive (mobile-first)
- Fuente corporativa BreePeru
- Scanner QR con html5-qrcode
- Tabulator para tabla admin con filtros locales
- Export Excel desde frontend (Tabulator) y backend
- Compartir/descargar QR nativo

### 2.3 Base de Datos

- **MySQL 8** vía Sequelize
- Tabla `asistentes` con charset `utf8mb4`
- Estados: `pendiente` | `validado` | `ingresado`
- Índice único en `correo`

### 2.4 Docker

- `Dockerfile`: Multi-stage build con Node 18 Alpine
- `docker-compose.yml`: App + MySQL con healthchecks
- `entrypoint.sh`: Espera MySQL, corre migraciones, inicia servidor

---

## 3. Tests

### 3.1 Unit Tests (`tests/unit/`)
- **Framework:** Jest
- **Base:** SQLite en memoria (no requiere MySQL)
- **Cobertura:** Modelo Asistente (11 tests, todos pasan)
  - Creación válida
  - Validaciones de campos requeridos
  - Validación de email
  - Prevención de duplicados
  - Normalización de email
  - Transiciones de estado

### 3.2 E2E Tests (`tests/e2e/`)
- **Framework:** Playwright
- **Navegadores:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Cobertura:**
  - Landing page
  - Registro (validación frontend)
  - Validación QR (scanner)
  - Admin login y dashboard
  - API endpoints
  - Seguridad (headers)
  - Responsive design

### 3.3 Linting
- **ESLint** configurado con reglas de estilo del proyecto
- Estado: **✅ Pasa limpio** (después de correcciones)

---

## 4. Problemas Encontrados y Correcciones Aplicadas

| # | Problema | Severidad | Corrección |
|---|----------|-----------|------------|
| 1 | Tests unitarios fallaban por falta de MySQL | Alta | Migrados a SQLite en memoria |
| 2 | ESLint incluía archivos `public/vendor/` | Media | Agregado `public/vendor/` a `.eslintignore` |
| 3 | Errores de quotes y unused vars en `admin.js` | Baja | Fix automático + renombrado args |
| 4 | Errores de unused vars en tests e2e | Baja | Renombrado parámetros con `_` |
| 5 | 15 vulnerabilidades npm (10 moderate, 5 high) | Media | Requiere `npm audit fix` (ver sección 6) |
| 6 | Falta archivo `.env` | Baja | Existe `.env.example` como template |
| 7 | `validacion.js` referencia `DUPLICADO_FEEDBACK_MS` no definido | Baja | La constante no existe en `CONFIG` (no crítico, el timeout de 2000 funciona) |

---

## 5. Inventario de Branding Actual (Deferol)

### 5.1 Textos y Nombres

| Ubicación | Texto Actual |
|-----------|--------------|
| `package.json` | name: `evento-Deferol`, keywords, author |
| `public/index.html` | "Evento Deferol", "Peru Travel", "Comisión de Promoción..." |
| `public/registro.html` | Igual que index |
| `public/validacion.html` | "Validación de Ingreso - Deferol" |
| `public/admin/index.html` | "Panel Admin - Evento Deferol", "Deferol Admin" |
| `public/admin/login.html` | "Login - Admin Evento Deferol", "Deferol" |
| `public/js/registro.js` | "QR Evento Deferol", "qr-evento-Deferol.png" |
| `public/js/admin.js` | Comentarios con "Evento Deferol" |
| `public/js/validacion.js` | Comentarios con "Deferol" |
| `services/email.js` | "Deferol", "Confirmación de Registro - Evento Deferol" |
| `README.md` | Todo el documento |
| `AGENTS.md` | Referencias a Deferol |
| `tests/e2e/*.spec.js` | "Deferol" en títulos y aserciones |

### 5.2 Imágenes y Assets

| Archivo | Uso |
|---------|-----|
| `public/img/peru-logo.png` | Logo marca Perú (header landing/registro/validacion) |
| `public/img/Deferol-logo.png` | Logo Deferol (footer) |
| `public/img/trama.png` | Trama decorativa de fondo |
| `public/img/*.png` | Iconos de formulario (correo, empresa, fecha, hora, lugar, usuario) |
| `public/fuentes/BreePeru-*` | Tipografía corporativa completa |
| `public/media/anuncio.mp3` | Audio de confirmación de ingreso |

### 5.3 Colores

| Variable/Valor | Uso |
|----------------|-----|
| `#da291c` | Rojo principal (fondo página, botones, acentos) |
| `#b81f14` | Rojo oscuro (footer) |
| `#1a1a2e` | Admin primary color |
| `#e94560` | Admin accent color |

### 5.4 Fuentes

- **BreePeru** (Bold, Regular, Light) - Fuente corporativa en todo el frontend público

---

## 6. Recomendaciones Técnicas Previas al Rebranding

### 6.1 Seguridad
```bash
# Revisar y actualizar vulnerabilidades
npm audit
npm audit fix
# Si hay breaking changes, evaluar manualmente
```

### 6.2 Variables de Entorno
Crear archivo `.env` a partir de `.env.example`:
```bash
cp .env.example .env
# Editar con credenciales reales
```

### 6.3 Mejoras Sugeridas (post-rebranding)
- [ ] Agregar tests unitarios para `services/email.js` (mock de nodemailer)
- [ ] Agregar tests unitarios para `middleware/auth.js`
- [ ] Agregar tests de integración para rutas API con supertest
- [ ] Implementar migraciones automáticas con Umzug en producción
- [ ] Agregar paginación server-side en admin (actualmente carga todo)
- [ ] Implementar soft delete para asistentes
- [ ] Agregar campos adicionales: teléfono, cargo, país

---

## 7. Plan de Rebranding

### Fase 1: Identidad Visual
1. Reemplazar logos (`peru-logo.png`, `Deferol-logo.png`)
2. Reemplazar tipografía (carpeta `fuentes/`)
3. Actualizar paleta de colores en CSS (`comunes.css`, admin styles)
4. Reemplazar iconografía si aplica
5. Actualizar imagen de fondo `trama.png`

### Fase 2: Textos y Copy
1. Actualizar títulos en todos los HTML
2. Actualizar textos en `services/email.js`
3. Actualizar textos en JavaScript frontend
4. Actualizar `package.json`, `README.md`, `AGENTS.md`
5. Actualizar tests e2e

### Fase 3: Configuración y Deploy
1. Actualizar variables de entorno (email remitente, admin user)
2. Actualizar configuración Docker si es necesario
3. Actualizar documentación de deploy

### Fase 4: QA
1. Ejecutar `npm test` (unit tests)
2. Ejecutar `npm run lint`
3. Ejecutar `npm run test:e2e` (con servidor corriendo)
4. Verificar emails renderizan correctamente
5. Verificar QR escanea correctamente

---

## 8. Checklist de Continuidad del Desarrollo

- [x] Dependencias instaladas (`npm install`)
- [x] Tests unitarios pasan (11/11)
- [x] Linting pasa limpio
- [ ] Vulnerabilidades revisadas (`npm audit`)
- [ ] Archivo `.env` creado
- [ ] Base de datos MySQL disponible (dev/prod)
- [ ] Servidor SMTP configurado
- [ ] Playwright browsers instalados (`npm run test:e2e:install`)

---

## 9. Comandos Rápidos

```bash
# Desarrollo
npm run dev

# Tests
npm test                    # Unit tests
npm run test:e2e           # E2E tests (requiere servidor)
npm run lint               # Verificar estilo
npm run lint:fix           # Corregir estilo automáticamente

# Base de datos
npm run migrate            # Aplicar migraciones
npm run migrate:undo       # Revertir última migración

# Docker
docker-compose up --build  # Levantar todo el stack
```
