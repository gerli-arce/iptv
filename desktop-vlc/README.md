# Fastnet Player Desktop con libVLC

Esta carpeta contiene una app nueva de escritorio para Windows usando Python + tkinter + python-vlc.

La app:
- usa libVLC embebido dentro de la ventana
- se conecta al backend Laravel existente
- carga canales y peliculas
- no requiere que el cliente instale VLC manualmente cuando se construye con `build.ps1`

## Requisitos de desarrollo

- Python 3.11
- acceso a internet para descargar el VLC oficial x64 al construir

## Instalacion

```powershell
python -m pip install -r desktop-vlc/requirements.txt
```

## Ejecutar en desarrollo

```powershell
python desktop-vlc/app.py
```

## Crear instalable

```powershell
powershell -ExecutionPolicy Bypass -File desktop-vlc/build.ps1
```

El ejecutable queda en:
- `dist/FastnetPlayerDesktop.exe`

## Uso

1. Abre la app.
2. Ingresa:
   - Backend URL
   - Servidor IPTV
   - Usuario
   - Contraseña
3. Pulsa `Conectar`.
4. Elige `TV en vivo` o `Peliculas`.
5. Haz doble clic en un item para reproducirlo.

## Notas

- `build.ps1` descarga la version oficial x64 de VLC desde VideoLAN y la empaqueta dentro del exe.
- En produccion, el cliente no necesita instalar VLC aparte.
- Las Series se pueden agregar despues usando el mismo backend.
