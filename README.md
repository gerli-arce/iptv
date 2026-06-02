# Fastplayer Platform

Proyecto Laravel unico para FASTNET:

- `/` muestra la landing IPTV de ventas
- `/login` muestra el acceso al reproductor
- `/app` carga el reproductor IPTV
- `/admin` queda reservado para el panel administrativo
- `/api` expone la API general y `/api/player` la API web del reproductor con sesion

## Stack

- Laravel
- React
- Vite
- Tailwind CSS

## Desarrollo

### Backend

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

### Frontend

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Docker

Construir y levantar el stack:

```bash
docker compose up --build
```

Servicios incluidos:

- `app`: Laravel + Apache en `http://127.0.0.1:8000`
- `mysql`: MySQL 8.4 expuesto en `127.0.0.1:3307`
- `redis`: Redis expuesto en `127.0.0.1:6380`

Notas:

- La imagen requiere `public/build/manifest.json`, asi que ejecuta `npm install && npm run build` antes del build Docker.
- `compose.yaml` corre migraciones automaticamente con `RUN_MIGRATIONS=true`.
- Si quieres usar otras credenciales, ajusta `compose.yaml` o tu `.env`.

## Estructura relevante

- `resources/js/landing/`: landing IPTV integrada
- `resources/js/spa.jsx`: reproductor/login React
- `resources/views/landing.blade.php`: entrada Blade de la landing
- `resources/views/spa.blade.php`: entrada Blade del reproductor
- `routes/web.php`: rutas web principales
- `routes/api.php`: API general

## Notas

- Solo existe un `package.json` activo
- La landing de IPTV se integra dentro del mismo frontend Laravel/Vite
- Se conserva un alias legacy en `/portal-api` para no romper integraciones internas durante la transicion
