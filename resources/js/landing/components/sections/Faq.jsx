import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQ } from "../../data/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

// Las respuestas siempre estan en el HTML (details/summary), asi los buscadores las leen aunque esten cerradas.
const Faq = () => {
  return (
    <section id="faq" className="scroll-mt-0 border-t-8 border-[#17171c] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 text-center"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-coral">Preguntas</p>
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">{FAQ.title}</h2>
        </motion.div>

        <div className="mt-12 divide-y divide-white/[0.08] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {FAQ.items.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-white transition hover:bg-white/[0.03] sm:px-6 [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-semibold">{item.q}</h3>
                <ChevronDown className="h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-300 group-open:rotate-180 group-open:text-coral" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400 sm:px-6 sm:text-base">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
