#!/bin/sh
set -e

echo "Esperando a MySQL..."
until nc -z mysql 3306; do
  sleep 1
done

echo "Ejecutando migraciones..."
npx sequelize-cli db:migrate || true

echo "Iniciando servidor..."
exec node server.js
