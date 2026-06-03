#!/usr/bin/env bash
set -e

cd /var/www/html

rm -f public/hot

mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/app/public
mkdir -p storage/logs
mkdir -p bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache

php artisan storage:link --force --relative || true
php artisan optimize:clear || true

if [ "${APP_ENV}" = "production" ]; then
    php artisan event:cache || true
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

if [ "${RUN_MIGRATIONS}" = "true" ]; then
    php artisan migrate --force
fi

if [ "${RUN_SEEDERS}" = "true" ]; then
    php artisan db:seed --force
fi

exec "$@"
