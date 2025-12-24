const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const variants = {
  primary:
    "bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)] hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(34,211,238,0.65)]",
  secondary:
    "bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/40 hover:bg-fuchsia-500/25",
  outline:
    "border border-cyan-400/50 text-cyan-200 hover:bg-cyan-400/10",
};

const sizes = {
  sm: "px-4 py-2 text-xs",
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
