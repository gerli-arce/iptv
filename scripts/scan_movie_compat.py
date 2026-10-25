#!/usr/bin/env python3
"""Escanea el catalogo (peliculas o series) y marca que NO se puede reproducir bien en un navegador.

Un navegador (Chrome/Brave/Edge) reproduce video H.264 con audio AAC/MP3/Opus. Muchos archivos traen
audio AC3/E-AC3/DTS: la imagen corre pero no hay sonido. Este script los detecta con ffprobe y guarda
el resultado en resources/data/, que la web usa para ocultarlos.

Uso (necesita ffprobe, por ejemplo en el servidor de peliculas):
    python3 scan_movie_compat.py --kind movies --server http://iptv.ejemplo.com --user USUARIO \
        --password CLAVE --out movie-compat.json --workers 3
    python3 scan_movie_compat.py --kind series ... --out series-compat.json

Luego copia el JSON a resources/data/ (movie-compat.json o series-compat.json).

Para re-escanear solo algunos elementos (por ejemplo los nuevos) y fusionar con el resultado anterior:
    ... --only 2090,2091 --merge movie-compat.json --out movie-compat.json
En series, --only recibe ids de EPISODIO.

Usa pocos --workers: la cuenta tiene un maximo de conexiones y cada ffprobe abre varias.
"""
import argparse
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

SAFE_VIDEO = {"h264", "vp8", "vp9", "av1"}
SAFE_AUDIO = {"aac", "mp3", "opus", "vorbis", "flac"}
BAD_H264_PROFILES = ("high 10", "high 4:2:2", "high 4:4:4")
EMPTY_SERIES = []  # series del panel que no tienen ningun episodio


def api(server, user, password, action, **extra):
    query = urllib.parse.urlencode({"username": user, "password": password, "action": action, **extra})
    with urllib.request.urlopen(f"{server.rstrip('/')}/player_api.php?{query}", timeout=60) as response:
        return json.loads(response.read().decode("utf-8", "replace"))


def fetch_movies(server, user, password):
    """Cada elemento: {"id", "ext", "path"}."""
    return [
        {"id": m["stream_id"], "ext": m.get("container_extension") or "mp4", "path": "movie"}
        for m in api(server, user, password, "get_vod_streams")
    ]


def fetch_episodes(server, user, password):
    """Cada elemento: {"id", "ext", "path", "series_id"} (un item por episodio)."""
    items = []
    for series in api(server, user, password, "get_series"):
        series_id = series["series_id"]
        try:
            info = api(server, user, password, "get_series_info", series_id=series_id)
        except Exception as error:  # noqa: BLE001
            print(f"  no se pudo leer la serie {series_id}: {error}", flush=True)
            continue
        episodes = info.get("episodes") or {}
        if isinstance(episodes, list):
            episodes = {"1": episodes}
        if not any(episodes.values()):
            EMPTY_SERIES.append(int(series_id))
        for season_episodes in episodes.values():
            for episode in season_episodes:
                episode_id = episode.get("id") or episode.get("stream_id")
                if episode_id:
                    items.append({
                        "id": int(episode_id),
                        "ext": episode.get("container_extension") or "mp4",
                        "path": "series",
                        "series_id": int(series_id),
                    })
    return items


def probe(url, timeout):
    cmd = [
        "ffprobe", "-v", "error", "-analyzeduration", "3000000", "-probesize", "6000000",
        "-print_format", "json", "-show_streams", "-show_format", url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if not result.stdout.strip():
        raise RuntimeError((result.stderr or "sin respuesta de ffprobe").strip().splitlines()[-1][:120])
    info = json.loads(result.stdout)
    # Con el servidor saturado ffprobe puede devolver un JSON sin streams: eso es una lectura fallida, no "sin video".
    if not info.get("streams"):
        raise RuntimeError("lectura vacia (el servidor no entrego el archivo)")
    return info


def verdict(info):
    """Devuelve None si se reproduce bien en navegador, o los motivos (separados por ' + ') si no."""
    streams = info.get("streams", [])
    videos = [s for s in streams if s.get("codec_type") == "video" and not s.get("disposition", {}).get("attached_pic")]
    audios = [s for s in streams if s.get("codec_type") == "audio"]
    reasons = []

    if not videos:
        return "sin video"
    video = videos[0]
    vcodec = video.get("codec_name", "?")
    profile = str(video.get("profile", "")).lower()
    if vcodec not in SAFE_VIDEO:
        reasons.append(f"video {vcodec}")
    elif vcodec == "h264" and (profile.startswith(BAD_H264_PROFILES) or "10" in str(video.get("pix_fmt", ""))):
        reasons.append(f"video h264 {profile or video.get('pix_fmt')}")

    if not audios:
        reasons.append("sin audio")
    else:
        # El navegador usa la pista marcada como predeterminada o, si no hay, la primera.
        track = next((a for a in audios if a.get("disposition", {}).get("default")), audios[0])
        acodec = track.get("codec_name", "?")
        if acodec not in SAFE_AUDIO:
            reasons.append(f"audio {acodec}")

    return " + ".join(reasons) or None


def scan_one(server, user, password, item, timeout):
    url = f"{server.rstrip('/')}/{item['path']}/{user}/{password}/{item['id']}.{item['ext']}"
    info, last_error = None, "?"
    for attempt in range(3):
        try:
            info = probe(url, timeout)
            break
        except Exception as error:  # noqa: BLE001
            last_error = str(error)[:120]
            time.sleep(1.5 * (attempt + 1))
    if info is None:
        return item["id"], "error", last_error
    reason = verdict(info)
    return item["id"], ("ok" if reason is None else "bad"), reason


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--kind", choices=["movies", "series"], default="movies")
    parser.add_argument("--server", required=True)
    parser.add_argument("--user", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--out", default="movie-compat.json")
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--timeout", type=int, default=40)
    parser.add_argument("--only", help="ids separados por coma: vuelve a escanear solo esos elementos")
    parser.add_argument("--hide-errors", action="store_true", help="los que siguen sin entregar archivo tras los reintentos se marcan como no reproducibles")
    parser.add_argument("--merge", help="JSON anterior al que se le actualizan solo los elementos de --only")
    args = parser.parse_args()

    label = "peliculas" if args.kind == "movies" else "episodios"
    catalog = (fetch_movies if args.kind == "movies" else fetch_episodes)(args.server, args.user, args.password)
    total = len(catalog)
    print(f"{total} {label} en el catalogo", flush=True)
    items = catalog
    if args.only:
        wanted = {int(i) for i in args.only.split(",") if i.strip()}
        items = [i for i in catalog if i["id"] in wanted]
        print(f"Escaneando solo {len(items)}", flush=True)

    unplayable, errors, ok = {}, {}, 0
    started = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(scan_one, args.server, args.user, args.password, item, args.timeout) for item in items]
        for done, future in enumerate(as_completed(futures), 1):
            item_id, status, detail = future.result()
            if status == "ok":
                ok += 1
            elif status == "bad":
                unplayable[str(item_id)] = detail
            else:
                errors[str(item_id)] = detail
            if done % 50 == 0:
                print(f"  {done}/{len(items)}  ({int(time.time() - started)}s)", flush=True)

    if args.merge:
        with open(args.merge, encoding="utf-8") as handle:
            previous = json.load(handle)
        rescanned = {str(i["id"]) for i in items}
        unplayable = {**{k: v for k, v in previous.get("unplayable", {}).items() if k not in rescanned}, **unplayable}
        errors = {**{k: v for k, v in previous.get("read_errors", {}).items() if k not in rescanned}, **errors}
        ok = total - len(unplayable) - len(errors)

    if args.hide_errors:
        for item_id in list(errors):
            unplayable[item_id] = "archivo no disponible"
        errors = {}
        ok = total - len(unplayable)

    # Las que dieron error de lectura NO se ocultan (puede ser algo temporal); solo se reportan.
    report = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "criteria": "video h264/vp9/av1 (no 10-bit) + audio aac/mp3/opus/vorbis/flac en la pista predeterminada",
        "kind": args.kind,
        "total": total,
        "playable": ok,
        "unplayable_count": len(unplayable),
        "read_errors": errors,
        "unplayable": dict(sorted(unplayable.items(), key=lambda kv: int(kv[0]))),
    }
    if args.kind == "series":
        # Que episodios pertenecen a cada serie: sirve para ocultar series completas.
        episodes_by_series = {}
        for item in catalog:
            episodes_by_series.setdefault(str(item["series_id"]), []).append(str(item["id"]))
        report["series_episodes"] = episodes_by_series
        report["series_without_episodes"] = sorted(EMPTY_SERIES)

    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=1)

    reasons = {}
    for reason in unplayable.values():
        reasons[reason] = reasons.get(reason, 0) + 1
    print(f"\nListo: {ok} reproducibles, {len(unplayable)} no reproducibles, {len(errors)} con error de lectura")
    for reason, count in sorted(reasons.items(), key=lambda kv: -kv[1]):
        print(f"  {count:4}  {reason}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
