import { motion, AnimatePresence } from "framer-motion";
import { Gift, MapPin, MessageCircle, User, X, IdCard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import { CUSTOMER_OPTIONS, SALES_WHATSAPP } from "../../data/constants";

const EMPTY_FORM = { name: "", dni: "", location: "", customer: "" };

const buildWhatsappUrl = (intro, { name, dni, location, customer }) => {
  const message = [
    intro,
    "",
    `*Nombre:* ${name.trim()}`,
    `*DNI:* ${dni}`,
    `*Lugar:* ${location.trim()}`,
    `*¿Cliente de Fastnet?:* ${customer}`,
  ].join("\n");

  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(message)}`;
};

const validate = ({ name, dni, location, customer }) => {
  const errors = {};
  if (name.trim().length < 3) errors.name = "Ingresa tu nombre completo.";
  if (!/^\d{8}$/.test(dni)) errors.dni = "El DNI debe tener 8 dígitos.";
  if (location.trim().length < 2) errors.location = "Indícanos desde dónde nos escribes.";
  if (!customer) errors.customer = "Selecciona una opción.";
  return errors;
};

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-coral/60 focus:outline-none focus:ring-2 focus:ring-coral/30";

const Field = ({ id, label, icon: Icon, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-zinc-300">
      {label}
    </label>
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      {children}
    </div>
    {error && <p className="mt-1 text-xs text-coral-soft">{error}</p>}
  </div>
);

// `lead` describe el formulario a mostrar (demo o contratar un plan); null lo cierra.
const LeadModal = ({ lead, onClose }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isOpen = Boolean(lead);
  // Se conserva el ultimo contenido para que no cambie durante la animacion de salida.
  const shown = useRef(lead);
  if (lead) shown.current = lead;
  const { title, subtitle, intro } = shown.current || {};

  useEffect(() => {
    if (!isOpen) return undefined;
    setErrors({});

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const update = (field) => (event) => {
    const value = field === "dni" ? event.target.value.replace(/\D/g, "").slice(0, 8) : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    window.open(buildWhatsappUrl(intro, form), "_blank", "noopener,noreferrer");
    setForm(EMPTY_FORM);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d11] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-coral/10 text-coral-soft">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="lead-title" className="text-lg font-semibold tracking-tight text-white">
                    {title}
                  </h2>
                  <p className="text-xs text-slate-400">{subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              <Field id="demo-name" label="Nombre completo" icon={User} error={errors.name}>
                <input
                  id="demo-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Ej. Juan Pérez Quispe"
                  className={inputClasses}
                />
              </Field>

              <Field id="demo-dni" label="DNI" icon={IdCard} error={errors.dni}>
                <input
                  id="demo-dni"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.dni}
                  onChange={update("dni")}
                  placeholder="8 dígitos"
                  className={inputClasses}
                />
              </Field>

              <Field id="demo-location" label="¿Desde dónde nos escribes?" icon={MapPin} error={errors.location}>
                <input
                  id="demo-location"
                  type="text"
                  autoComplete="address-level2"
                  value={form.location}
                  onChange={update("location")}
                  placeholder="Distrito / ciudad"
                  className={inputClasses}
                />
              </Field>

              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-zinc-300">¿Eres cliente de Fastnet?</legend>
                <div className="space-y-2">
                  {CUSTOMER_OPTIONS.map((option) => {
                    const checked = form.customer === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                          checked
                            ? "border-coral/60 bg-coral/10 text-white"
                            : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="demo-customer"
                          value={option.value}
                          checked={checked}
                          onChange={update("customer")}
                          className="h-4 w-4 accent-[#ff6363]"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
                {errors.customer && <p className="mt-1 text-xs text-coral-soft">{errors.customer}</p>}
              </fieldset>

              <Button type="submit" variant="primary" size="lg" className="w-full">
                <MessageCircle className="h-5 w-5" />
                Enviar por WhatsApp
              </Button>
              <p className="text-center text-[11px] text-zinc-500">
                Se abrirá WhatsApp con tus datos listos para enviar al área de ventas.
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LeadModal;
