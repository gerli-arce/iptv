import { Zap } from "lucide-react";
import Button from "../ui/Button";
import { BRAND, HERO, NAV_LINKS } from "../../data/constants";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-2 transition-all duration-300 sm:py-3">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/85 px-3 py-2.5 backdrop-blur-md shadow-lg shadow-black/20 sm:gap-4 sm:rounded-full sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300 sm:h-10 sm:w-10">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-[11px] uppercase tracking-[0.18em] text-cyan-200 sm:text-xs sm:tracking-[0.3em]">
                {BRAND.name}
              </div>
              <div className="hidden text-xs text-slate-300 min-[380px]:block">
                {BRAND.tagline}
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-medium uppercase tracking-[0.3em] text-slate-300 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition hover:text-cyan-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              as="a"
              href="/login"
              size="sm"
              variant="outline"
              className="px-3 text-[10px] sm:px-4 sm:text-xs"
            >
              Iniciar sesion
            </Button>
            <Button
              as="a"
              href="#pricing"
              size="sm"
              variant="primary"
              className="!hidden shrink-0 md:!inline-flex"
            >
              {HERO.primaryCta}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
