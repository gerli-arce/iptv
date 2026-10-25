const baseClasses =
  "inline-flex max-w-full items-center justify-center gap-2 rounded-lg text-center text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const variants = {
  primary:
    "bg-coral text-white shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_8px_28px_rgba(255,99,99,0.35)] hover:bg-coral-soft hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_12px_36px_rgba(255,99,99,0.5)]",
  secondary:
    "bg-white/[0.06] text-zinc-100 border border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] hover:bg-white/10 hover:-translate-y-0.5",
  outline:
    "border border-white/15 text-zinc-200 hover:border-white/30 hover:bg-white/5",
};

const sizes = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = ({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const classes = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={classes} {...props} />;
};

export default Button;
