import { motion } from "framer-motion";
import {
  Film,
  Globe,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Tv,
} from "lucide-react";
import { TvFrame } from "../ui/DeviceFrame";
import { FEATURES, SHOWCASE } from "../../data/constants";

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
    <section id="features" className="scroll-mt-0 border-t-8 border-[#17171c] py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
              {FEATURES.title}
            </h2>
            <p className="text-base text-zinc-400 sm:text-lg">{FEATURES.subtitle}</p>
          </div>

          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {FEATURES.items.map((feature) => {
              const Icon = icons[feature.icon] || Sparkles;
              return (
                <li key={feature.title} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <TvFrame src={SHOWCASE.tv} />
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
