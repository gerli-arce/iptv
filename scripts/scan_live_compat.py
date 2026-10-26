#!/usr/bin/env python3
"""Genera resources/data/live-compat.json: los canales en vivo que se reproducen bien en un navegador.

Lee del panel de 1-Stream el analisis que ya guarda de cada canal (codec de video y audio, si esta en linea)
y deja solo los que un navegador reproduce con imagen y sonido: video H.264 + audio AAC, MP2 o MP3.

Las credenciales del panel se leen de variables de entorno (no se guardan en ningun archivo):

    set FASTNET_PANEL_URL=https://iptv.fastnetperu.com.pe:8097
    set FASTNET_PANEL_USER=admin
    set FASTNET_PANEL_PASS=********
    python scripts/scan_live_compat.py

Vuelve a correrlo cuando cambies perfiles de transcodificacion (por ejemplo "audio only") o agregues canales.
El ID del canal en la lista es el mismo "stream_id" que entrega la API de las lineas.
"""
import http.cookiejar
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

PLAYABLE_VIDEO = {"h264"}
PLAYABLE_AUDIO = {"aac", "mp2", "mp3"}
OUT = os.path.join(os.path.dirname(__file__), "..", "resources", "data", "live-compat.json")


def clean(value):
    value = (value or "").strip().lower()
    return None if value in ("", "-", "none", "null") else value


def login(base, user, password):
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    html = opener.open(f"{base}/login", timeout=30).read().decode("utf-8", "replace")
    token = re.search(r'name="_token"\s+value="([^"]+)"', html) or re.search(r'value="([^"]+)"\s+name="_token"', html)
    if not token:
        sys.exit("No se encontro el formulario de login del panel.")
    data = urllib.parse.urlencode({"_token": token.group(1), "username": user, "password": password}).encode()
    response = opener.open(urllib.request.Request(f"{base}/login", data=data), timeout=30)
    if "/login" in response.geturl():
        sys.exit("Login rechazado: revisa FASTNET_PANEL_USER y FASTNET_PANEL_PASS.")
    return opener


def fetch_streams(base, opener):
    rows, start = [], 0
    while True:
        url = f"{base}/api/streams/list?show_status_details=true&with_bouquets=true&index={start // 100}&size=100&start={start}"
        request = urllib.request.Request(url, headers={"Accept": "application/json"})
        payload = json.loads(opener.open(request, timeout=60).read().decode("utf-8"))
        batch = payload.get("data", [])
        rows.extend(batch)
        start += 100
        if not batch or len(rows) >= payload.get("rowTotal", 0):
            return rows


def verdict(stream):
    info = stream.get("stream_info") or {}
    if stream.get("status") != "started" or info.get("status") != "online":
        return "sin senal"
    video, audio = clean(info.get("video_codec")), clean(info.get("audio_codec"))
    if video is None and audio:
        return f"solo audio ({audio})"
    if video not in PLAYABLE_VIDEO:
        return f"video {video or 'desconocido'}"
    if audio is None:
        return "sin audio detectado"
    if audio not in PLAYABLE_AUDIO:
        return f"audio {audio}"
    return None


def main():
    base = os.environ.get("FASTNET_PANEL_URL", "").rstrip("/")
    user, password = os.environ.get("FASTNET_PANEL_USER"), os.environ.get("FASTNET_PANEL_PASS")
    if not (base and user and password):
        sys.exit("Faltan FASTNET_PANEL_URL, FASTNET_PANEL_USER y FASTNET_PANEL_PASS (ver el inicio de este archivo).")

    streams = fetch_streams(base, login(base, user, password))
    playable, excluded = {}, {}
    for stream in streams:
        channel_id = str(stream.get("int_id"))
        reason = verdict(stream)
        if reason is None:
            playable[channel_id] = stream.get("name", "")
        else:
            excluded[channel_id] = {"name": stream.get("name", ""), "reason": reason}

    report = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "criteria": "en linea + video h264 + audio aac/mp2/mp3",
        "total": len(streams),
        "playable_count": len(playable),
        "playable": dict(sorted(playable.items(), key=lambda kv: int(kv[0]))),
        "excluded": dict(sorted(excluded.items(), key=lambda kv: int(kv[0]))),
    }
    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=1)

    reasons = {}
    for item in excluded.values():
        reasons[item["reason"]] = reasons.get(item["reason"], 0) + 1
    print(f"Listo: {len(playable)} canales reproducibles de {len(streams)}. Guardado en resources/data/live-compat.json")
    for reason, count in sorted(reasons.items(), key=lambda kv: -kv[1]):
        print(f"  {count:4}  no: {reason}")


if __name__ == "__main__":
    main()
