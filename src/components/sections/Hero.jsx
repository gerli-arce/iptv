import { motion } from "framer-motion";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import { HERO, STATS } from "../../data/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pb-16 pt-48"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
            <Sparkles className="h-4 w-4" />
            <span>{HERO.kicker}</span>
          </div>
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.08em] text-white sm:text-5xl lg:text-6xl">
              {HERO.title}
            </h1>
            <p className="text-base text-slate-300 sm:text-lg">
              {HERO.subtitle}
            </p>
            <p className="text-sm text-slate-400">{HERO.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button as="a" href="#pricing" variant="primary" size="lg">
              {HERO.primaryCta}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button as="a" href="#features" variant="outline" size="lg">
              <Play className="h-4 w-4" />
              {HERO.secondaryCta}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-center backdrop-blur"
              >
                <div className="text-lg font-semibold text-cyan-200">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -left-12 -top-8 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -bottom-10 right-0 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="space-y-3">
              <h2 className="font-display text-2xl text-white">
                {HERO.highlightTitle}
              </h2>
              <p className="text-sm text-slate-300">
                {HERO.highlightDescription}
              </p>
            </div>
            <div className="space-y-3">
              {HERO.highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-slate-900/60 px-4 py-3 text-sm text-cyan-100"
                >
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
