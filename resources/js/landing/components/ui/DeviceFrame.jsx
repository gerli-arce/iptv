import { Play } from "lucide-react";

const Screen = ({ src, alt = "", children }) => (
  <>
    {src ? (
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
    ) : (
      <div className="absolute inset-0 bg-[#0b0b10] bg-[radial-gradient(ellipse_80%_70%_at_30%_20%,rgba(255,99,99,0.55),transparent_60%),radial-gradient(ellipse_70%_60%_at_80%_90%,rgba(120,70,255,0.4),transparent_60%)]" />
    )}
    {children}
  </>
);

export const TvFrame = ({ src, alt = "" }) => (
  <div className="relative mx-auto w-full max-w-xl">
    <div className="pointer-events-none absolute -inset-8 rounded-full bg-coral/15 blur-3xl" />
    <div className="relative rounded-2xl border border-white/15 bg-[#050507] p-2 shadow-[0_40px_100px_rgba(0,0,0,0.7)] sm:p-2.5">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Screen src={src} alt={alt}>
          {!src && (
            <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-xl sm:h-16 sm:w-16">
            <Play className="h-6 w-6" fill="currentColor" />
          </span>
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded bg-coral px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            En vivo
          </span>
            </>
          )}
        </Screen>
      </div>
    </div>
    <div className="mx-auto h-3 w-1/4 bg-gradient-to-b from-zinc-700 to-zinc-900" />
    <div className="mx-auto h-1.5 w-2/5 rounded-full bg-zinc-800" />
  </div>
);

export const PhoneFrame = ({ src, alt = "" }) => (
  <div className="relative mx-auto w-52 sm:w-60">
    <div className="pointer-events-none absolute -inset-10 rounded-full bg-coral/15 blur-3xl" />
    <div className="relative rounded-[2rem] border border-white/15 bg-[#050507] p-2 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
      <div className="relative aspect-[9/19] overflow-hidden rounded-[1.5rem]">
        <Screen src={src} alt={alt}>
          {!src && (
            <img
              src="/logo-fastnet-player.png"
              alt="Fastnet Player"
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] shadow-[0_0_50px_rgba(255,60,60,0.55)]"
            />
          )}
        </Screen>
      </div>
    </div>
  </div>
);
