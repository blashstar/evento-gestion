# Evento Deferol

Aplicación de gestión de eventos con registro de asistentes, generación de códigos QR y panel administrativo.

## Requisitos Previos

- Node.js 18+
- Docker Desktop o Docker Compose
- MySQL 8 (o usar Docker)

## Instalación

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd evento-Deferol
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

## Desarrollo Local

### Con Docker (Recomendado)

```bash
docker-compose up
```

### Sin Docker

1. Iniciar MySQL localmente
2. Configurar variables de entorno en `.env`
3. Ejecutar:

```bash
npm run migrate
npm run dev
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Iniciar servidor en producción |
| `npm run dev` | Iniciar servidor con hot-reload |
| `npm run migrate` | Ejecutar migraciones pendientes |
| `npm run migrate:undo` | Revertir última migración |
| `npm test` | Ejecutar tests |
| `npm run lint` | Verificar estilo de código |
| `npm run lint:fix` | Corregir errores de estilo |

## Estructura del Proyecto

```
evento-Deferol/
├── models/              # Modelos Sequelize
├── migrations/          # Migraciones de BD
├── controllers/         # Lógica de negocio
├── routes/              # Definición de endpoints
├── middleware/          # Middleware personalizado
├── services/            # Servicios (email, QR)
├── config/              # Configuración
├── public/              # Archivos estáticos
├── server.js            # Punto de entrada
└── docker-compose.yml   # Orquestación Docker
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/registro | Registrar nuevo asistente |
| GET | /api/validar/:token | Validar correo |
| POST | /api/admin/login | Login administrador |
| GET | /api/admin/asistentes | Listar asistentes (auth) |
| POST | /api/admin/ingreso | Registrar ingreso (auth) |

## Despliegue

Ver PRD.md para instrucciones de despliegue en Easypanel.

## Licencia

MIT - Deferol