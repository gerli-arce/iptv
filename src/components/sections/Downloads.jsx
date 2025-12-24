import { motion } from "framer-motion";
import { Download, Smartphone, Tv } from "lucide-react";
import Button from "../ui/Button";

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
};

const Downloads = () => {
    return (
        <section id="downloads" className="scroll-mt-24 py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-cyan-500/10 p-10 backdrop-blur"
                >
                    <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />

                    <div className="relative space-y-6 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                            <Download className="h-4 w-4" />
                            <span>Descarga gratuita</span>
                        </div>

                        <h2 className="font-display text-3xl uppercase tracking-[0.2em] text-white sm:text-4xl">
                            Descarga Nuestras Apps
                        </h2>

                        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
                            Instala FASTNET TV en todos tus dispositivos y disfruta donde quieras, cuando quieras. Descarga gratuita y configuración automática.
                        </p>

                        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                            <motion.div
                                variants={fadeInUp}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                            >
                                <Button
                                    as="a"
                                    href="/FASTNET-TV-CELULAR.apk"
                                    download
                                    variant="primary"
                                    size="lg"
                                    className="min-w-[240px]"
                                >
                                    <Smartphone className="h-5 w-5" />
                                    Descargar para Celular
                                </Button>
                            </motion.div>

                            <motion.div
                                variants={fadeInUp}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Button
                                    as="a"
                                    href="/FASTNET-TV.apk"
                                    download
                                    variant="secondary"
                                    size="lg"
                                    className="min-w-[240px]"
                                >
                                    <Tv className="h-5 w-5" />
                                    Descargar para Android TV
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Downloads;
