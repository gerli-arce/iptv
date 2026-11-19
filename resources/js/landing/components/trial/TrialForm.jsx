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
  User,
} from "lucide-react";
import { useState } from "react";
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

// Identificador de este navegador para el limite de pruebas por dispositivo (la web no puede leer la MAC).
// Se guarda en localStorage y en una cookie de un año: si se borra uno, se recupera del otro.
const DEVICE_KEY = "fp_device_id";
const deviceId = () => {
  const fromCookie = document.cookie.match(new RegExp(`(?:^|; )${DEVICE_KEY}=([A-Za-z0-9-]{16,64})`))?.[1];
  let id = null;
  try {
    id = window.localStorage.getItem(DEVICE_KEY);
  } catch {
    // Sin acceso a localStorage (modo privado estricto): se usa solo la cookie.
  }
  id = (id && /^[A-Za-z0-9-]{16,64}$/.test(id) ? id : null) || fromCookie;
  if (!id) {
    id = window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
  try {
    window.localStorage.setItem(DEVICE_KEY, id);
  } catch {
    // Ignorado: la cookie basta.
  }
  document.cookie = `${DEVICE_KEY}=${id}; max-age=31536000; path=/; SameSite=Lax; Secure`;
  return id;
};

// Formulario de la prueba gratis (pagina /prueba-gratis). Crea la cuenta en el panel y, al terminar, muestra el
// usuario, la contraseña oculta y el enlace a Play Store.
const TrialForm = ({ onCreated }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);
  // Datos de la cuenta creada; con ellos se muestra la pantalla de exito.
  const [account, setAccount] = useState(null);

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
        body: JSON.stringify({ ...form, device_id: deviceId() }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setShowCreatedPassword(false);
        setAccount({ ...data, password: form.password });
        onCreated?.();
        return;
      }
      if (response.status === 422 && data.errors) {
        setErrors(Object.fromEntries(Object.entries(data.errors).map(([key, list]) => [key, list[0]])));
      }
      if (response.status === 419) {
        setFormError("La página caducó. Recárgala e inténtalo de nuevo.");
      } else if (response.status === 429) {
        // Limite diario de pruebas (mensaje del servidor) o freno de intentos.
        setFormError(data.daily_limit ? data.message : "Hiciste muchos intentos. Espera un rato e inténtalo de nuevo.");
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

  if (account) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-coral/10 text-coral-soft">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">¡Tu cuenta está lista!</h2>
            <p className="text-xs text-zinc-400">
              Prueba activa por {account.days} días, hasta el {formatDate(account.expires_at)}.
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-200">Descarga la aplicación e inicia sesión con los datos que acabas de crear.</p>

        <div className="space-y-3 rounded-xl border border-coral/30 bg-coral/[0.06] p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-400">Usuario</span>
            <span className="font-mono font-semibold text-white">{account.username}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-400">Contraseña</span>
            <span className="flex items-center gap-2">
              <span className="font-mono font-semibold text-white">
                {showCreatedPassword ? account.password : "*".repeat(account.password.length)}
              </span>
              <button
                type="button"
                onClick={() => setShowCreatedPassword((v) => !v)}
                aria-label={showCreatedPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="rounded p-1 text-zinc-500 hover:text-zinc-200"
              >
                {showCreatedPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </div>
        </div>

        <Button as="a" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" variant="primary" size="lg" className="w-full">
          <Smartphone className="h-5 w-5" />
          Descargar en Play Store
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="trial-name" label="Nombre completo" icon={User} error={errors.name} hint="Tal como figura en tu DNI">
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
  );
};

export default TrialForm;
