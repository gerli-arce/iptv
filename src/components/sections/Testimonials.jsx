import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { TESTIMONIALS } from "../../data/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const Testimonials = () => {
  return (
    <section id="testimonials" className="scroll-mt-24 py-16">
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
            {TESTIMONIALS.title}
          </h2>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.items.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={fadeInUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.08,
              }}
              whileHover={{ y: -6 }}
              className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <MessageSquare className="h-6 w-6 text-fuchsia-300" />
              <p className="mt-4 text-sm text-slate-200">
                {testimonial.quote}
              </p>
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-cyan-200">
                {testimonial.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
