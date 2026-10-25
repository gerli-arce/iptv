import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote } from "lucide-react";
import { TESTIMONIALS } from "../../data/constants";

const Testimonials = () => {
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.items.length;

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % total), 7000);
    return () => clearInterval(id);
  }, [active, total]);

  const current = TESTIMONIALS.items[active];

  return (
    <section id="testimonials" className="scroll-mt-0 border-t-8 border-[#17171c] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-coral">
          {TESTIMONIALS.title}
        </p>

        <div className="relative mt-8 min-h-[250px] sm:min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <Quote className="mx-auto h-8 w-8 text-coral" />
              <blockquote className="text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
                {current.quote}
              </blockquote>
              <figcaption className="text-sm font-medium text-zinc-400">
                {current.name}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {TESTIMONIALS.items.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Testimonio de ${item.name}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-8 bg-coral" : "w-3 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
