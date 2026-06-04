import os
import re
import sys
import threading
import tkinter as tk
from dataclasses import dataclass
from pathlib import Path
from tkinter import messagebox, ttk

import requests


def resource_path(*parts: str) -> Path:
    base_dir = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return base_dir.joinpath(*parts)


def find_vlc_dir() -> Path | None:
    candidates = [
        resource_path("vlc"),
        Path(__file__).resolve().parent / "vlc-runtime",
    ]

    is_64bit_python = sys.maxsize > 2**32
    if is_64bit_python:
        candidates.append(Path(r"C:\Program Files\VideoLAN\VLC"))
    else:
        candidates.append(Path(r"C:\Program Files (x86)\VideoLAN\VLC"))

    for candidate in candidates:
        if (candidate / "libvlc.dll").exists():
            return candidate
    return None


def bootstrap_vlc_environment() -> tuple[Path | None, Path | None]:
    vlc_dir = find_vlc_dir()
    plugins_dir = vlc_dir / "plugins" if vlc_dir else None

    if vlc_dir:
        if hasattr(os, "add_dll_directory"):
            os.add_dll_directory(str(vlc_dir))
        os.environ["PATH"] = str(vlc_dir) + os.pathsep + os.environ.get("PATH", "")
        if plugins_dir and plugins_dir.exists():
            os.environ["VLC_PLUGIN_PATH"] = str(plugins_dir)

    return vlc_dir, plugins_dir


def vlc_arch_hint() -> str:
    is_64bit_python = sys.maxsize > 2**32
    x64_vlc = Path(r"C:\Program Files\VideoLAN\VLC\libvlc.dll")
    x86_vlc = Path(r"C:\Program Files (x86)\VideoLAN\VLC\libvlc.dll")

    if is_64bit_python and not x64_vlc.exists() and x86_vlc.exists():
        return (
            "Tu Python es de 64 bits y solo hay VLC de 32 bits instalado. "
            "Instala VLC de 64 bits para poder embebir libVLC en esta app."
        )

    if not x64_vlc.exists() and not x86_vlc.exists():
        return "No se encontro ninguna instalacion de VLC en la PC."

    return ""


VLC_DIR, VLC_PLUGINS_DIR = bootstrap_vlc_environment()

_CWD_BEFORE_VLC_IMPORT = Path.cwd()
try:
    if VLC_DIR:
        os.chdir(str(VLC_DIR))
    import vlc
except Exception as exc:  # pragma: no cover - hard runtime dependency
    vlc = None
    VLC_IMPORT_ERROR = exc
else:
    VLC_IMPORT_ERROR = None
finally:
    try:
        os.chdir(_CWD_BEFORE_VLC_IMPORT)
    except Exception:
        pass


def build_live_url(server_url: str, username: str, password: str, stream_id: int, ext: str = "m3u8") -> str:
    return f"{server_url.rstrip('/')}/live/{username}/{password}/{stream_id}.{ext}"


def build_movie_url(server_url: str, username: str, password: str, stream_id: int, ext: str = "mp4") -> str:
    return f"{server_url.rstrip('/')}/movie/{username}/{password}/{stream_id}.{ext}"


@dataclass
class SessionInfo:
    backend_url: str
    server_url: str
    username: str
    password: str
    user: dict


class ApiClient:
    def __init__(self):
        self.session = requests.Session()
        self.info: SessionInfo | None = None
        self.csrf_token: str | None = None

    def fetch_csrf_token(self, backend_url: str) -> str:
        login_url = backend_url.rstrip("/") + "/login"
        response = self.session.get(login_url, timeout=30)
        response.raise_for_status()

        match = re.search(r'<meta name="csrf-token" content="([^"]+)"', response.text)
        if not match:
            raise RuntimeError("No se pudo obtener el token CSRF del backend.")

        self.csrf_token = match.group(1)
        return self.csrf_token

    def login(self, backend_url: str, server_url: str, username: str, password: str) -> SessionInfo:
        csrf_token = self.fetch_csrf_token(backend_url)
        payload = {
            "server_url": server_url,
            "username": username,
            "password": password,
        }
        url = backend_url.rstrip("/") + "/api/player/login"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Origin": backend_url.rstrip("/"),
            "Referer": backend_url.rstrip("/") + "/login",
            "X-CSRF-TOKEN": csrf_token,
            "X-Requested-With": "XMLHttpRequest",
        }
        response = self.session.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        if not data.get("ok"):
            raise RuntimeError(data.get("message") or "Login failed")
        self.info = SessionInfo(
            backend_url=backend_url.rstrip("/"),
            server_url=server_url.rstrip("/"),
            username=username,
            password=password,
            user=data.get("user") or {},
        )
        return self.info

    def get_json(self, path: str, params: dict | None = None) -> dict:
        if not self.info:
            raise RuntimeError("Not authenticated")
        url = self.info.backend_url + path
        response = self.session.get(url, params=params or {}, timeout=45)
        response.raise_for_status()
        return response.json()


class VideoPlayer:
    def __init__(self, host_widget: tk.Widget):
        if vlc is None:
            raise RuntimeError(f"python-vlc no pudo inicializarse: {VLC_IMPORT_ERROR}")

        self.host_widget = host_widget
        self.instance = vlc.Instance(
            "--no-video-title-show",
            "--quiet",
            "--network-caching=1200",
            "--live-caching=1200",
            "--file-caching=1200",
        )
        self.player = self.instance.media_player_new()
        self._bind_handle()

    def _bind_handle(self):
        self.host_widget.update_idletasks()
        hwnd = self.host_widget.winfo_id()
        if sys.platform.startswith("win"):
            self.player.set_hwnd(hwnd)
        elif sys.platform == "darwin":
            self.player.set_nsobject(hwnd)
        else:
            self.player.set_xwindow(hwnd)

    def play(self, url: str):
        self._bind_handle()
        media = self.instance.media_new(url)
        media.add_option(":network-caching=1200")
        media.add_option(":live-caching=1200")
        media.add_option(":file-caching=1200")
        self.player.set_media(media)
        self.player.play()

    def stop(self):
        try:
            self.player.stop()
        except Exception:
            pass

    def release(self):
        self.stop()
        try:
            self.player.release()
        except Exception:
            pass
        try:
            self.instance.release()
        except Exception:
            pass


class LoginFrame(ttk.Frame):
    def __init__(self, master, on_login):
        super().__init__(master, padding=20)
        self.on_login = on_login

        self.columnconfigure(1, weight=1)

        ttk.Label(self, text="Fastnet Player Desktop", font=("Segoe UI", 20, "bold")).grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 16))

        self.backend_url = tk.StringVar(value="https://fastv.fastnetperu.com.pe")
        self.server_url = tk.StringVar()
        self.username = tk.StringVar()
        self.password = tk.StringVar()

        fields = [
            ("Backend URL", self.backend_url),
            ("Servidor IPTV", self.server_url),
            ("Usuario", self.username),
            ("Contraseña", self.password),
        ]

        for idx, (label, var) in enumerate(fields, start=1):
            ttk.Label(self, text=label).grid(row=idx, column=0, sticky="w", pady=6)
            entry = ttk.Entry(self, textvariable=var, show="*" if label == "Contraseña" else "")
            entry.grid(row=idx, column=1, sticky="ew", pady=6)

        self.login_button = ttk.Button(self, text="Conectar", command=self._submit)
        self.login_button.grid(row=len(fields) + 1, column=0, columnspan=2, sticky="ew", pady=(14, 0))

        self.status = tk.StringVar(value="Ingresa tus datos IPTV para comenzar.")
        ttk.Label(self, textvariable=self.status, foreground="#5b6475", wraplength=520).grid(row=len(fields) + 2, column=0, columnspan=2, sticky="w", pady=(12, 0))

    def set_busy(self, busy: bool):
        self.login_button.configure(state="disabled" if busy else "normal")

    def _submit(self):
        backend_url = self.backend_url.get().strip()
        server_url = self.server_url.get().strip()
        username = self.username.get().strip()
        password = self.password.get().strip()

        if not backend_url or not server_url or not username or not password:
            messagebox.showerror("Faltan datos", "Completa backend, servidor, usuario y contraseña.")
            return

        self.set_busy(True)
        self.status.set("Conectando...")

        def worker():
            try:
                info = self.on_login(backend_url, server_url, username, password)
            except Exception as exc:
                self.after(0, lambda: self._login_failed(exc))
            else:
                self.after(0, lambda: self._login_ok(info))

        threading.Thread(target=worker, daemon=True).start()

    def _login_failed(self, exc: Exception):
        self.set_busy(False)
        self.status.set("No se pudo iniciar sesion.")
        messagebox.showerror("Error de acceso", str(exc))

    def _login_ok(self, _info):
        self.set_busy(False)


class App(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.master = master
        self.api = ApiClient()
        self.session: SessionInfo | None = None
        self.channels: list[dict] = []
        self.movies: list[dict] = []
        self.categories: list[dict] = []
        self.current_list = "live"
        self.filtered_items: list[dict] = []

        self.login_frame = LoginFrame(self, self._do_login)
        self.login_frame.pack(fill="both", expand=True)

        self.main_frame = None
        self.video_player: VideoPlayer | None = None
        self.video_host = None
        self.status_var = tk.StringVar(value="Listo")
        self.search_var = tk.StringVar()
        self.category_var = tk.StringVar(value="all")
        self.category_map: dict[str, list[dict]] = {"all": []}

    def _do_login(self, backend_url: str, server_url: str, username: str, password: str):
        info = self.api.login(backend_url, server_url, username, password)
        self.session = info
        self.master.after(0, self._build_main_ui)
        return info

    def _build_main_ui(self):
        self.login_frame.pack_forget()
        if self.main_frame is not None:
            self.main_frame.destroy()

        self.main_frame = ttk.Frame(self, padding=10)
        self.main_frame.pack(fill="both", expand=True)
        self.main_frame.rowconfigure(1, weight=1)
        self.main_frame.columnconfigure(0, weight=0)
        self.main_frame.columnconfigure(1, weight=1)

        left = ttk.Frame(self.main_frame, width=360)
        left.grid(row=0, column=0, rowspan=2, sticky="nsw", padx=(0, 10))
        left.rowconfigure(2, weight=1)
        left.columnconfigure(0, weight=1)

        topbar = ttk.Frame(left)
        topbar.grid(row=0, column=0, sticky="ew")
        topbar.columnconfigure((0, 1, 2), weight=1)

        ttk.Button(topbar, text="TV en vivo", command=self.load_live).grid(row=0, column=0, sticky="ew", padx=(0, 4))
        ttk.Button(topbar, text="Peliculas", command=self.load_movies).grid(row=0, column=1, sticky="ew", padx=4)
        ttk.Button(topbar, text="Actualizar", command=self.refresh_current).grid(row=0, column=2, sticky="ew", padx=(4, 0))

        search_row = ttk.Frame(left)
        search_row.grid(row=1, column=0, sticky="ew", pady=(10, 8))
        search_row.columnconfigure(0, weight=1)
        self.search_entry = ttk.Entry(search_row, textvariable=self.search_var)
        self.search_entry.grid(row=0, column=0, sticky="ew")
        ttk.Button(search_row, text="Buscar", command=self.apply_filters).grid(row=0, column=1, padx=(8, 0))

        category_row = ttk.Frame(left)
        category_row.grid(row=2, column=0, sticky="nsew")
        category_row.rowconfigure(1, weight=1)
        category_row.columnconfigure(0, weight=1)

        ttk.Label(category_row, text="Categorias").grid(row=0, column=0, sticky="w", pady=(0, 6))
        self.category_list = tk.Listbox(category_row, height=10, exportselection=False)
        self.category_list.grid(row=1, column=0, sticky="nsew")
        self.category_list.bind("<<ListboxSelect>>", lambda _e: self.apply_filters())

        ttk.Label(left, text="Contenido").grid(row=3, column=0, sticky="w", pady=(10, 6))
        self.items_tree = ttk.Treeview(left, columns=("name",), show="headings", height=18)
        self.items_tree.heading("name", text="Nombre")
        self.items_tree.column("name", width=320, stretch=True)
        self.items_tree.grid(row=4, column=0, sticky="nsew")
        self.items_tree.bind("<Double-1>", lambda _e: self.play_selected())

        actions = ttk.Frame(left)
        actions.grid(row=5, column=0, sticky="ew", pady=(10, 0))
        actions.columnconfigure((0, 1), weight=1)
        ttk.Button(actions, text="Reproducir", command=self.play_selected).grid(row=0, column=0, sticky="ew", padx=(0, 4))
        ttk.Button(actions, text="Detener", command=self.stop_playback).grid(row=0, column=1, sticky="ew", padx=(4, 0))

        right = ttk.Frame(self.main_frame)
        right.grid(row=0, column=1, rowspan=2, sticky="nsew")
        right.rowconfigure(0, weight=1)
        right.columnconfigure(0, weight=1)

        self.video_host = tk.Frame(right, bg="black", height=620)
        self.video_host.grid(row=0, column=0, sticky="nsew")
        self.video_host.bind("<Configure>", lambda _e: self._rebind_video())

        status_bar = ttk.Label(self.main_frame, textvariable=self.status_var, anchor="w")
        status_bar.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(10, 0))

        self.video_player = VideoPlayer(self.video_host)
        self.load_live()

    def _rebind_video(self):
        if self.video_player:
            try:
                self.video_player._bind_handle()
            except Exception:
                pass

    def set_status(self, text: str):
        self.status_var.set(text)
        print(text)

    def refresh_current(self):
        if self.current_list == "live":
            self.load_live()
        else:
            self.load_movies()

    def load_live(self):
        self.current_list = "live"
        self.set_status("Cargando canales en vivo...")

        def worker():
            try:
                data = self.api.get_json("/api/player/live")
            except Exception as exc:
                self.after(0, lambda: messagebox.showerror("Error", f"No se pudieron cargar los canales.\n{exc}"))
                return

            self.channels = data.get("channels") or []
            self.categories = data.get("categories") or []
            self.category_map = {"all": self.channels}
            for ch in self.channels:
                key = str(ch.get("category_id") or "all")
                self.category_map.setdefault(key, []).append(ch)

            self.after(0, self._render_live)

        threading.Thread(target=worker, daemon=True).start()

    def _render_live(self):
        self.category_list.delete(0, tk.END)
        self.category_list.insert(tk.END, "Todo")
        for cat in self.categories:
            self.category_list.insert(tk.END, cat.get("category_name") or "Categoria")
        self.category_list.selection_clear(0, tk.END)
        self.category_list.selection_set(0)
        self.category_list.activate(0)
        self.apply_filters()
        self.set_status(f"Canales cargados: {len(self.channels)}")

    def load_movies(self):
        self.current_list = "movies"
        self.set_status("Cargando peliculas...")

        def worker():
            try:
                data = self.api.get_json("/api/player/movies")
            except Exception as exc:
                self.after(0, lambda: messagebox.showerror("Error", f"No se pudieron cargar las peliculas.\n{exc}"))
                return

            self.movies = data.get("items") or []
            self.categories = data.get("categories") or []
            self.category_map = {"all": self.movies}
            for mv in self.movies:
                key = str(mv.get("category_id") or "all")
                self.category_map.setdefault(key, []).append(mv)

            self.after(0, self._render_movies)

        threading.Thread(target=worker, daemon=True).start()

    def _render_movies(self):
        self.category_list.delete(0, tk.END)
        self.category_list.insert(tk.END, "Todo")
        for cat in self.categories:
            self.category_list.insert(tk.END, cat.get("category_name") or "Categoria")
        self.category_list.selection_clear(0, tk.END)
        self.category_list.selection_set(0)
        self.category_list.activate(0)
        self.apply_filters()
        self.set_status(f"Peliculas cargadas: {len(self.movies)}")

    def _selected_category_id(self) -> str:
        selection = self.category_list.curselection()
        if not selection or selection[0] == 0:
            return "all"
        idx = selection[0] - 1
        if 0 <= idx < len(self.categories):
            return str(self.categories[idx].get("category_id") or "all")
        return "all"

    def apply_filters(self):
        query = self.search_var.get().strip().lower()
        selected_category = self._selected_category_id()
        source = self.category_map.get(selected_category, [])
        if selected_category == "all":
            source = self.channels if self.current_list == "live" else self.movies

        if query:
            source = [item for item in source if query in str(item.get("name") or "").lower()]

        self.filtered_items = source
        self.items_tree.delete(*self.items_tree.get_children())
        for idx, item in enumerate(source):
            self.items_tree.insert("", tk.END, iid=str(idx), values=(item.get("name") or "Sin titulo",))

    def _selected_item(self) -> dict | None:
        selection = self.items_tree.selection()
        if not selection:
            return None
        idx = int(selection[0])
        if 0 <= idx < len(self.filtered_items):
            return self.filtered_items[idx]
        return None

    def play_selected(self):
        if not self.session:
            return
        item = self._selected_item()
        if not item:
            messagebox.showinfo("Selecciona un item", "Selecciona un canal o una pelicula primero.")
            return

        try:
            if self.current_list == "live":
                stream_id = int(item.get("stream_id") or 0)
                url = build_live_url(self.session.server_url, self.session.username, self.session.password, stream_id, "m3u8")
            else:
                stream_id = int(item.get("stream_id") or item.get("id") or 0)
                ext = item.get("container_extension") or item.get("containerExtension") or "mp4"
                url = build_movie_url(self.session.server_url, self.session.username, self.session.password, stream_id, ext)

            self.set_status(f"Reproduciendo: {item.get('name')}")
            self.video_player.play(url)
        except Exception as exc:
            messagebox.showerror("Error de reproduccion", str(exc))

    def stop_playback(self):
        if self.video_player:
            self.video_player.stop()
        self.set_status("Reproduccion detenida")


def main():
    root = tk.Tk()
    root.title("Fastnet Player Desktop")
    root.geometry("1500x900")
    root.minsize(1280, 800)

    style = ttk.Style(root)
    try:
        style.theme_use("clam")
    except tk.TclError:
        pass

    if vlc is None:
        hint = vlc_arch_hint()
        extra = f"\n\n{hint}" if hint else ""
        messagebox.showerror(
            "Falta VLC",
            "No se pudo cargar python-vlc.\n"
            "Asegurate de tener VLC instalado para que libVLC pueda usarse en esta app."
            f"{extra}",
        )
        root.destroy()
        return 1

    app = App(root)
    app.pack(fill="both", expand=True)

    def on_close():
        try:
            if app.video_player:
                app.video_player.release()
        finally:
            root.destroy()

    root.protocol("WM_DELETE_WINDOW", on_close)
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
