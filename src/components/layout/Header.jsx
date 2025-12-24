import { Zap } from "lucide-react";
import Button from "../ui/Button";
import { BRAND, HERO, NAV_LINKS } from "../../data/constants";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-3 transition-all duration-300">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-slate-900/80 px-4 py-3 backdrop-blur-md shadow-lg shadow-black/20">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
              <Zap className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-xs uppercase tracking-[0.3em] text-cyan-200">
                {BRAND.name}
              </div>
              <div className="text-xs text-slate-300">{BRAND.tagline}</div>
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

          <Button
            as="a"
            href="#pricing"
            size="sm"
            variant="primary"
            className="shrink-0"
          >
            {HERO.primaryCta}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
