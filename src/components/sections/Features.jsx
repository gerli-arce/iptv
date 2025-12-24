import { motion } from "framer-motion";
import {
  Film,
  Globe,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Tv,
} from "lucide-react";
import { FEATURES } from "../../data/constants";

const icons = {
  Tv,
  Globe,
  MonitorPlay,
  ShieldCheck,
  Film,
  Sparkles,
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const Features = () => {
  return (
    <section id="features" className="scroll-mt-24 py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <h2 className="font-display text-3xl uppercase tracking-[0.2em] text-white sm:text-4xl">
            {FEATURES.title}
          </h2>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            {FEATURES.subtitle}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.items.map((feature, index) => {
            const Icon = icons[feature.icon] || Sparkles;
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  delay: index * 0.08,
                }}
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.45)" }}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
