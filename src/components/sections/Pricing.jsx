import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import Button from "../ui/Button";
import { PRICING } from "../../data/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const Pricing = () => {
  return (
    <section id="pricing" className="scroll-mt-24 py-16">
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
            {PRICING.title}
          </h2>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            {PRICING.subtitle}
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {PRICING.plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.08,
              }}
              whileHover={{ y: -6, scale: plan.highlighted ? 1.01 : 1 }}
              className={`relative rounded-3xl border p-8 backdrop-blur ${plan.highlighted
                  ? "border-cyan-400/60 bg-gradient-to-br from-cyan-400/20 via-slate-900/70 to-fuchsia-500/20 shadow-[0_0_45px_rgba(34,211,238,0.25)]"
                  : "border-white/10 bg-white/5"
                }`}
            >
              {plan.highlighted && (
                <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  <Crown className="h-4 w-4" />
                  <span>{plan.badge}</span>
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-300">{plan.description}</p>
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-lg text-slate-300">{plan.currency}</span>
                <span className="text-4xl font-semibold text-white">
                  {plan.price}
                </span>
                <span className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  / {plan.period}
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-cyan-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant={plan.highlighted ? "primary" : "outline"}
                size="lg"
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
