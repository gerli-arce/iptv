import { motion } from "framer-motion";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import { useTypewriter } from "../../hooks/useTypewriter";
import { HERO, PRICING, SHOWCASE, STATS } from "../../data/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const Hero = ({ onOpenDemo }) => {
  const startPlan = PRICING.plans[0];
  const typedWord = useTypewriter(HERO.rotatingWords);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-32 pt-32 sm:px-6"
    >
      {SHOWCASE.hero && (
        <>
          <img
            src={SHOWCASE.hero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/70" />
        </>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#08080b_85%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[20%] sm:h-[30%] overflow-hidden">
        <div className="absolute -bottom-[60%] left-1/2 h-[120%] w-[160%] -translate-x-1/2 rounded-[100%] border-t-2 border-coral/70 bg-ink shadow-[0_-10px_80px_rgba(255,99,99,0.55)]" />
      </div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center space-y-6 text-center"
      >
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-coral/25 bg-coral/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-coral-soft">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>{HERO.kicker}</span>
        </div>

        <h1
          aria-label={`${HERO.title}: ${HERO.rotatingWords.join(", ")}`}
          className="text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl"
        >
          <span className="block bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent" aria-hidden="true">
            {HERO.title}
          </span>
          <span className="block min-h-[1.05em] whitespace-nowrap bg-gradient-to-r from-coral to-coral-soft bg-clip-text text-transparent" aria-hidden="true">
            {typedWord || "​"}
            <span className="ml-1 inline-block h-[0.82em] w-[0.07em] translate-y-[0.06em] animate-[fpBlink_1s_steps(1)_infinite] rounded-sm bg-coral align-baseline" />
          </span>
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-xl">
          {HERO.subtitle}
        </p>

        <p className="text-sm text-zinc-400 sm:text-base">
          Desde{" "}
          <span className="font-bold text-white">
            {startPlan.currency} {startPlan.price}
          </span>{" "}
          al {startPlan.period} · {HERO.description}
        </p>

        <div className="flex w-full flex-col items-stretch justify-center gap-3 pt-2 min-[380px]:w-auto min-[380px]:flex-row">
          <Button as="a" href="#pricing" variant="primary" size="lg" className="sm:px-8 sm:py-4 sm:text-lg">
            {HERO.primaryCta}
            <ArrowUpRight className="h-5 w-5" />
          </Button>
          <Button type="button" onClick={onOpenDemo} variant="secondary" size="lg" className="sm:px-8 sm:py-4 sm:text-lg">
            <Play className="h-5 w-5" />
            {HERO.secondaryCta}
          </Button>
        </div>

        <dl className="grid grid-cols-4 justify-items-center gap-x-2 gap-y-3 pt-6 font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-baseline sm:gap-2 sm:text-left">
              <dd className="order-first text-lg font-bold text-white sm:order-none sm:text-base">{stat.value}</dd>
              <dt className="text-[9px] leading-tight sm:text-xs">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  );
};

export default Hero;
