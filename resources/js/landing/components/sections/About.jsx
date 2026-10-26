import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ABOUT } from "../../data/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const About = () => {
  return (
    <section id="about" className="scroll-mt-0 py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-coral">Televisión por internet</p>
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">{ABOUT.title}</h2>
          {ABOUT.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-zinc-400 sm:text-lg">
              {paragraph}
            </p>
          ))}
        </motion.div>

        <motion.ul
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="space-y-4 self-center"
        >
          {ABOUT.points.map((point) => (
            <li key={point} className="flex items-start gap-3 border-b border-white/[0.07] pb-4 text-base text-zinc-200 last:border-0">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
};

export default About;
