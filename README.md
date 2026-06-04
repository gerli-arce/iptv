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

- La imagen compila el frontend dentro del build de Docker, asi que no necesitas subir `public/build` a mano.
- Si haces despliegue manual fuera de Docker, ejecuta `npm install && npm run build` y sube el contenido de `public/build`.
- `compose.yaml` corre migraciones automaticamente con `RUN_MIGRATIONS=true`.
- Si quieres usar otras credenciales, ajusta `compose.yaml` o tu `.env`.

## Desktop

Tambien puedes convertir el reproductor en una app instalable para PC con Electron.

### Ejecutar en desarrollo

```bash
npm install
npm run desktop:dev
```

### Crear instalador de Windows

```bash
npm run desktop:build
```

Notas:

- La app de escritorio abre `https://fastv.fastnetperu.com.pe/app` por defecto.
- Para reproducir en modo nativo, Electron intentara usar VLC o MPV instalado en la PC.
- Si no detecta un reproductor nativo, creara una playlist temporal `.m3u8` para abrirla con la asociacion de Windows.

## Desktop libVLC embebido

Si quieres una app de escritorio mas cercana a la version movil, tambien agregue una base nueva con `python-vlc` en:

- [`desktop-vlc/app.py`](/d:/VSCODE/fastplayer/desktop-vlc/app.py)

Esta version:
- usa libVLC embebido dentro de la ventana
- se conecta al backend Laravel existente
- permite reproducir canales y peliculas dentro de la app

Requisitos:
- Python 3.11
- VLC instalado en Windows con la misma arquitectura que Python

Comandos:

```bash
python -m pip install -r desktop-vlc/requirements.txt
python desktop-vlc/app.py
```

Para generar instalable:

```bash
powershell -ExecutionPolicy Bypass -File desktop-vlc/build.ps1
```

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
