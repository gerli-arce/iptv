const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  isDesktop: true,
  openNativeStream: (streamUrl, title) => ipcRenderer.invoke("desktop:open-stream", { streamUrl, title }),
  openVlcStream: (streamUrl) => ipcRenderer.invoke("desktop:open-vlc-stream", { streamUrl }),
  hasVlc: () => ipcRenderer.invoke("desktop:has-vlc"),
  openExternal: (url) => ipcRenderer.invoke("desktop:open-external", { url }),
  getAppInfo: () => ipcRenderer.invoke("desktop:app-info"),
});
