# Desarrollo Local - Modo Watch

Este proyecto está configurado para ejecutarse en modo desarrollo con nodemon.

## Comandos

### Iniciar en modo desarrollo (con nodemon - auto-restart)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Iniciar en modo producción (sin nodemon)
```bash
docker compose up -d
```

### Ver logs en tiempo real
```bash
docker compose logs -f app
```

### Detener contenedores
```bash
docker compose down
```

## Cambios de Código

Cuando modificas los archivos de código fuente y quieres que se reflejen en el contenedor:

1. **Sin hot reload**: Reconstruir la imagen:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

2. **Con nodemon activo**: Los cambios se reinician automáticamente dentro del contenedor. Accede a los logs para ver el reinicio:
```bash
docker compose logs -f app
```

## Archivos Monitoreados por Nodemon

Nodemon monitorea automáticamente cambios en:
- `server.js`
- `routes/`
- `controllers/`
- `models/`
- `middleware/`
- `services/`
- `config/`
- `migrations/`

## Configuración

- **Dockerfile**: Imagen multi-stage que incluye devDependencies (nodemon)
- **docker-compose.dev.yml**: Override que ejecuta `npm run dev` en lugar de `npm start`
- **.nodemonrc.json**: Configuración de nodemon (qué archivos monitorear, delays, etc.)

## Notas Importantes

- Los `node_modules` están dentro del contenedor
- La base de datos MySQL persiste en `./data/mysql/`
- Para instalar nuevas dependencias: `docker compose exec app npm install`
- Los logs muestran mensajes de nodemon cuando se detectan cambios
