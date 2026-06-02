# FastNet TV - Fase 1 Backend

Backend Laravel para controlar el home (banners + secciones + referencias a 1Stream).

## 1) Requisitos
- PHP 8.2+
- Composer
- MySQL

## 2) Configurar base de datos
Crear DB:
- `fastnet_home`

Revisar `.env`:
- `DB_CONNECTION=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_DATABASE=fastnet_home`
- `DB_USERNAME=root`
- `DB_PASSWORD=`

## 3) Instalar y levantar
```bash
cd backend
composer install
php artisan migrate
php artisan db:seed
php artisan serve
```

Admin semilla:
- email: `admin@fastnet.tv`
- password: `admin12345`

## 4) Endpoints
Publico:
- `GET /api/home`

Admin auth:
- `POST /api/admin/login`
- `POST /api/admin/logout` (Bearer token)

Admin CRUD:
- `api/admin/banners` (resource)
- `api/admin/sections` (resource)
- `GET /api/admin/sections/{section}/items`
- `POST /api/admin/sections/{section}/items`
- `PUT /api/admin/sections/{section}/items/{item}`
- `DELETE /api/admin/sections/{section}/items/{item}`

## 5) Ejemplo login
```json
{
  "email": "admin@fastnet.tv",
  "password": "admin12345"
}
```

## 6) Integracion React/Vite (app actual)
Crear util (ejemplo):
```js
export async function getHomeConfig() {
  const res = await fetch('http://127.0.0.1:8000/api/home');
  if (!res.ok) throw new Error('No se pudo cargar el home');
  return res.json();
}
```

Flujo recomendado en frontend:
1. Leer `/api/home`.
2. Renderizar banners y secciones por `position`.
3. Resolver cada `section_item` con tu data Xtream local por `content_type + external_id`.
4. Si no existe en Xtream, ocultarlo silenciosamente.

## 7) Estructura de referencia guardada
`section_items` solo guarda:
- `content_type` (`movie|series|live`)
- `external_id` (ID real 1Stream)
- `position`
- `active`

No se duplica catalogo completo.
