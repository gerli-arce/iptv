import { motion, AnimatePresence } from "framer-motion";
import {
  AtSign,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Home,
  IdCard,
  KeyRound,
  Loader2,
  Phone,
  Smartphone,
  Tv,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../ui/Button";
import { PLAY_STORE_URL, TRIAL } from "../../data/constants";

const EMPTY_FORM = { name: "", dni: "", address: "", city: "", phone: "", username: "", password: "", website: "" };

const validate = ({ name, dni, address, city, phone, username, password }) => {
  const errors = {};
  if (name.trim().length < 3) errors.name = "Ingresa tu nombre completo.";
  if (!/^\d{8}$/.test(dni)) errors.dni = "El DNI debe tener 8 dígitos.";
  if (address.trim().length < 5) errors.address = "Ingresa tu dirección.";
  if (city.trim().length < 2) errors.city = "Ingresa tu ciudad.";
  if (!/^9\d{8}$/.test(phone)) errors.phone = "Celular de 9 dígitos que empiece con 9.";
  if (!/^[a-z0-9]{4,20}$/.test(username)) errors.username = "De 4 a 20 letras minúsculas o números, sin espacios.";
  if (password.length < 6 || /\s/.test(password)) errors.password = "Mínimo 6 caracteres, sin espacios.";
  return errors;
};

// Limpia lo que se escribe para que solo entren caracteres validos en cada campo.
const sanitize = {
  dni: (v) => v.replace(/\D/g, "").slice(0, 8),
  phone: (v) => v.replace(/\D/g, "").slice(0, 9),
  username: (v) => v.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20),
  password: (v) => v.replace(/\s/g, "").slice(0, 30),
};

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-coral/60 focus:outline-none focus:ring-2 focus:ring-coral/30";

const Field = ({ id, label, icon: Icon, error, hint, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-zinc-300">
      {label}
    </label>
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      {children}
    </div>
    {error ? (
      <p className="mt-1 text-xs text-coral-soft">{error}</p>
    ) : (
      hint && <p className="mt-1 text-[11px] text-zinc-500">{hint}</p>
    )}
  </div>
);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });

const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content ?? "";

const TrialModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Datos de la cuenta creada; con ellos se muestra la pantalla de exito.
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !sending) onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose, sending]);

  const close = () => {
    if (sending) return;
    onClose();
    // Tras crear la cuenta, la proxima apertura empieza con el formulario limpio.
    if (account) {
      setAccount(null);
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setFormError("");
  };

  const update = (field) => (event) => {
    const raw = event.target.value;
    const value = sanitize[field] ? sanitize[field](raw) : raw;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;
    const found = validate(form);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      const response = await fetch("/api/trial", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": csrfToken() },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setAccount({ ...data, password: form.password });
        return;
      }
      if (response.status === 422 && data.errors) {
        setErrors(Object.fromEntries(Object.entries(data.errors).map(([key, list]) => [key, list[0]])));
      }
      if (response.status === 419) {
        setFormError("La página caducó. Recárgala e inténtalo de nuevo.");
      } else if (response.status === 429) {
        setFormError("Hiciste muchos intentos. Espera un rato e inténtalo de nuevo.");
      } else if (!data.errors) {
        // Solo se muestran los mensajes que el servidor escribe para el cliente (502/503); nunca errores internos.
        const friendly = [502, 503].includes(response.status) && data.message;
        setFormError(friendly || "No pudimos crear tu cuenta. Intenta en unos minutos.");
      }
    } catch {
      setFormError("Sin conexión. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d11] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-coral/10 text-coral-soft">
                  {account ? <CheckCircle2 className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                </div>
                <div>
                  <h2 id="trial-title" className="text-lg font-semibold tracking-tight text-white">
                    {account ? "¡Tu cuenta está lista!" : TRIAL.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {account
                      ? `Prueba activa por ${account.days} días, hasta el ${formatDate(account.expires_at)}.`
                      : TRIAL.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {account ? (
              <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-2 rounded-xl border border-coral/30 bg-coral/[0.06] p-4">
                  <p className="text-xs text-zinc-400">Tus datos para entrar a la app:</p>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-zinc-400">Usuario</span>
                    <span className="font-mono font-semibold text-white">{account.username}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-zinc-400">Contraseña</span>
                    <span className="font-mono font-semibold text-white">{account.password}</span>
                  </div>
                  <p className="pt-1 text-[11px] text-zinc-500">Toma una captura de pantalla para no olvidarlos.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-300">1. Descarga la app</p>
                  <Button as="a" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" variant="primary" size="md" className="w-full">
                    <Smartphone className="h-5 w-5" />
                    Descargar en Play Store
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button as="a" href="/FASTNET-TV-CELULAR.apk" download variant="secondary" size="md" className="w-full px-3 text-xs">
                      <Smartphone className="h-4 w-4" />
                      APK Celular
                    </Button>
                    <Button as="a" href="/FASTNET-TV.apk" download variant="secondary" size="md" className="w-full px-3 text-xs">
                      <Tv className="h-4 w-4" />
                      APK Android TV
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-300">2. Ingresa con tu usuario y contraseña</p>
                  <Button as="a" href="/login" variant="secondary" size="md" className="w-full">
                    O mira ahora desde el navegador
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                <Field id="trial-name" label="Nombre completo" icon={User} error={errors.name}>
                  <input id="trial-name" type="text" autoComplete="name" value={form.name} onChange={update("name")} placeholder="Ej. Juan Pérez Quispe" className={inputClasses} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="trial-dni" label="DNI" icon={IdCard} error={errors.dni}>
                    <input id="trial-dni" type="text" inputMode="numeric" autoComplete="off" value={form.dni} onChange={update("dni")} placeholder="8 dígitos" className={inputClasses} />
                  </Field>
                  <Field id="trial-phone" label="Celular" icon={Phone} error={errors.phone}>
                    <input id="trial-phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={form.phone} onChange={update("phone")} placeholder="9XXXXXXXX" className={inputClasses} />
                  </Field>
                </div>

                <Field id="trial-address" label="Dirección" icon={Home} error={errors.address}>
                  <input id="trial-address" type="text" autoComplete="street-address" value={form.address} onChange={update("address")} placeholder="Av. / Jr. / Calle y número" className={inputClasses} />
                </Field>

                <Field id="trial-city" label="Ciudad" icon={Building2} error={errors.city}>
                  <input id="trial-city" type="text" autoComplete="address-level2" value={form.city} onChange={update("city")} placeholder="Ej. Pichanaki" className={inputClasses} />
                </Field>

                <div className="border-t border-white/10 pt-4">
                  <p className="mb-3 text-xs text-zinc-400">Crea el usuario y la contraseña con los que entrarás a la app:</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="trial-username" label="Usuario" icon={AtSign} error={errors.username} hint="Letras minúsculas y números">
                      <input id="trial-username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={form.username} onChange={update("username")} placeholder="Ej. juanperez" className={inputClasses} />
                    </Field>
                    <Field id="trial-password" label="Contraseña" icon={KeyRound} error={errors.password} hint="Mínimo 6 caracteres">
                      <input id="trial-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={update("password")} placeholder="••••••" className={`${inputClasses} pr-10`} />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </Field>
                  </div>
                </div>

                {/* Campo trampa para bots: oculto a personas y lectores de pantalla. */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={update("website")} className="hidden" />

                {formError && (
                  <p role="alert" className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral-soft">
                    {formError}
                  </p>
                )}

                <Button type="submit" variant="primary" size="lg" className="w-full disabled:cursor-wait disabled:opacity-70" disabled={sending}>
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gift className="h-5 w-5" />}
                  {sending ? "Creando tu cuenta..." : `Crear mi prueba de ${TRIAL.days} días`}
                </Button>
                <p className="text-center text-[11px] text-zinc-500">Una prueba por persona. Tus datos solo se usan para tu cuenta.</p>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TrialModal;
