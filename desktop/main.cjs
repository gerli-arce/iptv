const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const { launchNativeStream, launchVlcStream, findVlcPath } = require("./native-player.cjs");

const START_URL = process.env.DESKTOP_APP_URL || (app.isPackaged
  ? "https://fastv.fastnetperu.com.pe/app"
  : "http://127.0.0.1:8000/app");
const START_ORIGIN = new URL(START_URL).origin;

function resolveStreamUrl(streamUrl) {
  if (!streamUrl) {
    return streamUrl;
  }

  try {
    return new URL(streamUrl, START_ORIGIN).href;
  } catch {
    return streamUrl;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#030712",
    autoHideMenuBar: true,
    title: "Fastnet Player Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("http://127.0.0.1:8000") && !url.startsWith("https://fastv.fastnetperu.com.pe")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.loadURL(START_URL);
}

ipcMain.handle("desktop:open-stream", async (_event, { streamUrl, title }) => {
  return launchNativeStream(resolveStreamUrl(streamUrl), title);
});

ipcMain.handle("desktop:open-vlc-stream", async (_event, { streamUrl }) => {
  return launchVlcStream(resolveStreamUrl(streamUrl));
});

ipcMain.handle("desktop:has-vlc", async () => Boolean(findVlcPath()));

ipcMain.handle("desktop:open-external", async (_event, { url }) => {
  if (url) {
    await shell.openExternal(url);
  }
  return true;
});

ipcMain.handle("desktop:app-info", async () => ({
  startUrl: START_URL,
  packaged: app.isPackaged,
}));

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
