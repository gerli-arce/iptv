import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Download, Monitor, Smartphone, Settings, HelpCircle, Video } from "lucide-react";
import { useState } from "react";

const ManualModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("install");

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/50 px-6 py-4 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-display text-lg font-semibold uppercase tracking-wider text-white">
                                        Manual de Usuario
                                    </h2>
                                    <p className="text-xs text-slate-400">Guía completa de instalación y uso</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content Layout */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar */}
                            <aside className="hidden w-64 flex-col gap-1 border-r border-white/10 bg-slate-950/30 p-4 md:flex">
                                <TabButton
                                    active={activeTab === "install"}
                                    onClick={() => setActiveTab("install")}
                                    icon={Download}
                                    label="Instalación"
                                />
                                <TabButton
                                    active={activeTab === "config"}
                                    onClick={() => setActiveTab("config")}
                                    icon={Settings}
                                    label="Configuración"
                                />
                                <TabButton
                                    active={activeTab === "usage"}
                                    onClick={() => setActiveTab("usage")}
                                    icon={Monitor}
                                    label="Navegación"
                                />
                                <TabButton
                                    active={activeTab === "troubleshoot"}
                                    onClick={() => setActiveTab("troubleshoot")}
                                    icon={HelpCircle}
                                    label="Solución de problemas"
                                />
                                <TabButton
                                    active={activeTab === "video"}
                                    onClick={() => setActiveTab("video")}
                                    icon={Video}
                                    label="Video Tutorial"
                                />
                            </aside>

                            {/* Main Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                                {/* Mobile Tabs */}
                                <div className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
                                    <TabButtonMobile active={activeTab === "install"} onClick={() => setActiveTab("install")} label="Instalación" />
                                    <TabButtonMobile active={activeTab === "config"} onClick={() => setActiveTab("config")} label="Configuración" />
                                    <TabButtonMobile active={activeTab === "usage"} onClick={() => setActiveTab("usage")} label="Uso" />
                                    <TabButtonMobile active={activeTab === "video"} onClick={() => setActiveTab("video")} label="Video" />
                                </div>

                                <div className="space-y-8">
                                    {activeTab === "install" && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <Section title="Para Celular Android" icon={Smartphone}>
                                                <ol className="ml-4 list-decimal space-y-2 text-slate-300">
                                                    <li>Descarga el archivo APK desde el botón "Descargar para Celular".</li>
                                                    <li>Ve a <span className="text-cyan-300">Configuración {'>'} Seguridad</span> y permite la instalación de fuentes desconocidas.</li>
                                                    <li>Abre el archivo descargado e instálalo.</li>
                                                    <li>Abre la aplicación FASTNET TV.</li>
                                                </ol>
                                            </Section>
                                            <Section title="Para Android TV / TV Box" icon={TvIcon}>
                                                <ol className="ml-4 list-decimal space-y-2 text-slate-300">
                                                    <li>Descarga el archivo APK desde el botón "Descargar para Android TV".</li>
                                                    <li>Transfiere el archivo a tu TV vía USB o usa una app como "Send Files to TV".</li>
                                                    <li>Instala usando un explorador de archivos (ej. File Commander).</li>
                                                    <li>Abre la aplicación desde el menú de apps.</li>
                                                </ol>
                                            </Section>
                                        </div>
                                    )}

                                    {activeTab === "config" && (
                                        <div className="space-y-6 animate-in fade-in duration-500">
                                            <Section title="Primeros Pasos" icon={Settings}>
                                                <ul className="ml-4 list-disc space-y-2 text-slate-300">
                                                    <li>Ingresa tu <strong>Usuario</strong> y <strong>Contraseña</strong> proporcionados por el soporte.</li>
                                                    <li>La aplicación descargará automáticamente la lista de canales.</li>
                                                    <li>Selecciona tu perfil si es necesario.</li>
                                                </ul>
                                            </Section>
                                        </div>
                                    )}

                                    {activeTab === "usage" && (
                                        <div className="space-y-6 animate-in fade-in duration-500">
                                            <Section title="Canales en Vivo" icon={TvIcon}>
                                                <p className="text-slate-300">Navega por categorías (Deportes, Noticias, etc). Usa el control remoto para cambiar de canal. Presiona OK para ver la lista.</p>
                                            </Section>
                                            <Section title="Películas y Series" icon={FilmIcon}>
                                                <p className="text-slate-300">Accede a la biblioteca VOD. Puedes buscar por título, género o año. Soporta subtítulos y cambio de idioma.</p>
                                            </Section>
                                        </div>
                                    )}

                                    {activeTab === "troubleshoot" && (
                                        <div className="space-y-6 animate-in fade-in duration-500">
                                            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                                                <h4 className="flex items-center gap-2 font-semibold text-yellow-500">
                                                    <HelpCircle className="h-5 w-5" />
                                                    Si la app no carga:
                                                </h4>
                                                <ul className="mt-2 ml-6 list-disc text-sm text-slate-300">
                                                    <li>Verifica tu conexión a internet.</li>
                                                    <li>Limpia la caché de la aplicación en los ajustes de Android.</li>
                                                    <li>Reinicia tu dispositivo.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "video" && (
                                        <div className="animate-in fade-in duration-500 space-y-6">
                                            <h3 className="mb-4 text-xl font-semibold text-white">Video Tutorial</h3>
                                            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                                                <video controls className="w-full" poster="/video-poster-placeholder.jpg">
                                                    <source src="/tuto_tv.mp4" type="video/mp4" />
                                                    Tu navegador no soporta el video.
                                                </video>
                                            </div>
                                            <p className="mt-4 text-center text-sm text-slate-400">
                                                Aprende a instalar y configurar FASTNET TV paso a paso.
                                            </p>

                                            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                                                        <Download className="h-6 w-6 text-cyan-300" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="mb-2 font-semibold text-white">Manual en PDF</h4>
                                                        <p className="mb-4 text-sm text-slate-300">
                                                            Descarga el manual completo en formato PDF para consultarlo sin conexión.
                                                        </p>
                                                        <a
                                                            href="/manual%20IPTV.pdf"
                                                            download
                                                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/20 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/30"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Descargar Manual PDF
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// Subcomponents for cleanliness
const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${active
            ? "bg-cyan-400/10 text-cyan-300 shadow-[inset_3px_0_0_0_#22d3ee]"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
    >
        <Icon className="h-4 w-4" />
        {label}
    </button>
);

const TabButtonMobile = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all ${active ? "bg-cyan-400 text-slate-900" : "bg-white/5 text-slate-400"
            }`}
    >
        {label}
    </button>
);

const Section = ({ title, icon: Icon, children }) => (
    <div className="rounded-xl border border-white/5 bg-white/5 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <Icon className="h-5 w-5 text-cyan-400" />
            {title}
        </h3>
        {children}
    </div>
);

// Fallback icons if not imported above
const TvIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect width="20" height="15" x="2" y="7" rx="2" />
        <polyline points="17 2 12 7 7 2" />
    </svg>
);

const FilmIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 3v18" />
        <path d="M3 7.5h4" />
        <path d="M3 12h18" />
        <path d="M3 16.5h4" />
        <path d="M17 3v18" />
        <path d="M17 7.5h4" />
        <path d="M17 16.5h4" />
    </svg>
);

export default ManualModal;
