const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { shell, dialog } = require("electron");

function isWindows() {
  return process.platform === "win32";
}

function isMac() {
  return process.platform === "darwin";
}

function candidatePlayerPaths() {
  if (isWindows()) {
    return [
      "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
      "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",
      "C:\\Program Files\\mpv\\mpv.exe",
      "C:\\Program Files (x86)\\mpv\\mpv.exe",
    ];
  }

  if (isMac()) {
    return [
      "/Applications/VLC.app/Contents/MacOS/VLC",
      "/Applications/mpv.app/Contents/MacOS/mpv",
    ];
  }

  return [
    "/usr/bin/vlc",
    "/usr/local/bin/vlc",
    "/snap/bin/vlc",
    "/usr/bin/mpv",
    "/usr/local/bin/mpv",
  ];
}

function findPlayerPath() {
  return candidatePlayerPaths().find((playerPath) => fs.existsSync(playerPath)) || null;
}

function candidateVlcPaths() {
  if (isWindows()) {
    return [
      "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
      "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",
    ];
  }

  if (isMac()) {
    return ["/Applications/VLC.app/Contents/MacOS/VLC"];
  }

  return [
    "/usr/bin/vlc",
    "/usr/local/bin/vlc",
    "/snap/bin/vlc",
  ];
}

function findVlcPath() {
  return candidateVlcPaths().find((playerPath) => fs.existsSync(playerPath)) || null;
}

function spawnDetached(command, args) {
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return true;
}

function buildTempPlaylist(streamUrl, title = "Fastnet Player") {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fastnet-player-"));
  const filePath = path.join(tempDir, "stream.m3u8");
  const playlist = `#EXTM3U\n#EXTINF:-1,${title}\n${streamUrl}\n`;
  fs.writeFileSync(filePath, playlist, "utf8");
  return filePath;
}

async function launchNativeStream(streamUrl, title = "Fastnet Player") {
  if (!streamUrl) {
    throw new Error("Missing stream URL");
  }

  const playerPath = findPlayerPath();
  if (playerPath) {
    const lower = playerPath.toLowerCase();
    if (lower.includes("vlc")) {
      return spawnDetached(playerPath, [
        "--one-instance",
        "--no-video-title-show",
        "--network-caching=1500",
        "--live-caching=1500",
        streamUrl,
      ]);
    }

    if (lower.includes("mpv")) {
      return spawnDetached(playerPath, [
        "--force-window=yes",
        "--profile=low-latency",
        "--cache=yes",
        "--cache-secs=15",
        "--demuxer-lavf-o=fflags=+nobuffer",
        streamUrl,
      ]);
    }

    return spawnDetached(playerPath, [streamUrl]);
  }

  const playlistPath = buildTempPlaylist(streamUrl, title);
  const openPathResult = await shell.openPath(playlistPath);
  if (openPathResult) {
    await dialog.showMessageBox({
      type: "warning",
      title: "Reproductor no encontrado",
      message: "No se detecto VLC ni MPV. Instala uno de esos reproductores o asocia archivos .m3u8 en tu PC.",
      detail: `Intento de apertura: ${openPathResult}`,
    });
  }

  return true;
}

async function launchVlcStream(streamUrl) {
  if (!streamUrl) {
    throw new Error("Missing stream URL");
  }

  const vlcPath = findVlcPath();
  if (!vlcPath) {
    await dialog.showMessageBox({
      type: "warning",
      title: "VLC no encontrado",
      message: "No se detecto VLC instalado en esta PC.",
      detail: "Instala VLC y vuelve a intentar desde Ajustes para usar el reproductor externo.",
    });
    return false;
  }

  return spawnDetached(vlcPath, [
    "--one-instance",
    "--no-video-title-show",
    "--network-caching=1500",
    "--live-caching=1500",
    streamUrl,
  ]);
}

module.exports = {
  launchNativeStream,
  findPlayerPath,
  launchVlcStream,
  findVlcPath,
};
