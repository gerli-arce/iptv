import Button from "../ui/Button";
import { BRAND, HERO, NAV_LINKS } from "../../data/constants";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-2 sm:py-3">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0d0d11]/80 px-3 py-2 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:gap-4 sm:px-4">
          <a href="#hero" className="flex shrink-0 items-center" aria-label={`${BRAND.name} - ${BRAND.tagline}`}>
            <img
              src="/logo-fastnet-wordmark.png"
              alt={BRAND.name}
              width="636"
              height="344"
              className="-my-1 h-14 w-auto drop-shadow-[0_2px_16px_rgba(255,60,60,0.3)] transition duration-300 hover:scale-[1.04] sm:h-16 md:h-[72px]"
            />
          </a>

          <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-400 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              as="a"
              href="/login"
              size="sm"
              variant="secondary"
              className="px-3 sm:px-4"
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
