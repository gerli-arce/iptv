import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import Button from "../ui/Button";
import { PRICING } from "../../data/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const Pricing = ({ onSelectPlan }) => {
  return (
    <section id="pricing" className="scroll-mt-0 border-t-8 border-[#17171c] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl space-y-4 text-center"
        >
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
            {PRICING.title}
          </h2>
          <p className="text-base text-zinc-400">{PRICING.subtitle}</p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-4xl items-center gap-4 lg:grid-cols-2">
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
              className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${
                plan.highlighted
                  ? "border-coral/50 bg-[#110b0c] lg:scale-[1.04] shadow-[0_0_0_1px_rgba(255,99,99,0.15),0_30px_90px_rgba(255,99,99,0.15)]"
                  : "border-white/10 bg-white/[0.025]"
              }`}
            >
              {plan.highlighted && (
                <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-coral/25 blur-3xl" />
              )}

              {plan.highlighted && (
                <div className="relative mb-4 inline-flex items-center gap-2 rounded-md border border-coral/30 bg-coral/10 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-coral-soft sm:absolute sm:right-6 sm:top-6 sm:mb-0">
                  <Crown className="h-3.5 w-3.5 shrink-0" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div className="relative space-y-2">
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  {plan.name}
                </h3>
                <p className="text-sm text-zinc-400">{plan.description}</p>
              </div>

              <div className="relative mt-6 flex items-end gap-2">
                <span className="pb-1.5 text-lg text-zinc-400">{plan.currency}</span>
                <span className="text-6xl font-extrabold leading-none tracking-[-0.04em] text-white">
                  {plan.price}
                </span>
                <span className="pb-1.5 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
                  / {plan.period}
                </span>
              </div>

              <ul className="relative mt-7 space-y-3 border-t border-white/[0.08] pt-6 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                onClick={() => onSelectPlan(plan)}
                variant={plan.highlighted ? "primary" : "secondary"}
                size="lg"
                className="relative mt-8 w-full"
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
