import { motion } from "framer-motion";
import { BookOpen, Download, Smartphone, Tv } from "lucide-react";
import Button from "../ui/Button";
import { PhoneFrame } from "../ui/DeviceFrame";
import { PLAY_STORE_URL, SHOWCASE, STEPS } from "../../data/constants";
import { InstallAction } from "../../../spa/InstallApp";

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
};

const PlayIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="#00d2ff" d="M3.6 2.2c-.3.3-.5.8-.5 1.4v16.8c0 .6.2 1.1.5 1.4l.1.1 9.4-9.4v-.2L3.7 2.1z" />
        <path fill="#ffce00" d="m16.2 15.4-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.7 2.1z" />
        <path fill="#ff3a44" d="M16.3 15.3 13.1 12.2 3.6 21.8c.4.4.9.4 1.6.1l11.1-6.6" />
        <path fill="#00f076" d="M16.3 9 5.2 2.2c-.7-.4-1.2-.3-1.6.1l9.5 9.5z" />
    </svg>
);

const Downloads = ({ onOpenManual }) => {
    return (
        <section id="downloads" className="scroll-mt-0 border-t-8 border-[#17171c] py-20 sm:py-28">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="order-2 lg:order-1"
                >
                    <PhoneFrame src={SHOWCASE.phone} alt="App Fastnet Player en el celular: TV por internet, películas y series" />
                </motion.div>

                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    className="order-1 space-y-8 lg:order-2"
                >
                    <div className="space-y-4">
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-coral">
                            Descarga gratuita
                        </p>
                        <h2 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
                            Descarga la app Fastnet Player
                        </h2>
                        <p className="text-base leading-relaxed text-zinc-400 sm:text-lg">
                            Instala Fastnet Player, tu televisión por internet, en todos tus dispositivos y disfruta donde quieras, cuando quieras. Descarga gratuita y configuración automática.
                        </p>
                    </div>

                    <ol className="space-y-4">
                        {STEPS.map((step, index) => (
                            <li key={step.title} className="flex items-start gap-4">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-coral/40 bg-coral/10 font-mono text-xs font-bold text-coral-soft">
                                    {index + 1}
                                </span>
                                <p className="text-sm leading-relaxed text-zinc-400">
                                    <span className="font-semibold text-white">{step.title}.</span>{" "}
                                    {step.description}
                                </p>
                            </li>
                        ))}
                    </ol>

                    <div className="space-y-4 rounded-2xl border border-coral/25 bg-coral/[0.06] p-5">
                        <p className="text-base font-semibold text-white sm:text-lg">
                            Descarga nuestra aplicación oficial desde Play Store
                        </p>
                        <Button
                            as="a"
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="primary"
                            size="lg"
                            className="w-full px-6 text-sm sm:w-auto sm:text-base"
                        >
                            <PlayIcon className="h-5 w-5" />
                            Disponible en Play Store
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                            O instala el APK directamente
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Button
                                as="a"
                                href="/FASTNET-TV-CELULAR.apk"
                                download
                                variant="secondary"
                                size="md"
                                className="w-full px-5 text-sm sm:w-auto"
                            >
                                <Smartphone className="h-5 w-5" />
                                Descargar para Celular
                            </Button>
                            <Button
                                as="a"
                                href="/FASTNET-TV.apk"
                                download
                                variant="secondary"
                                size="md"
                                className="w-full px-5 text-sm sm:w-auto"
                            >
                                <Tv className="h-5 w-5" />
                                Descargar para Android TV
                            </Button>
                        </div>
                    </div>
                    <InstallAction>
                        {({ onClick }) => (
                            <div className="space-y-3">
                                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                                    O úsala como app, sin descargar nada
                                </p>
                                <Button type="button" onClick={onClick} variant="secondary" size="md" className="w-full px-5 text-sm sm:w-auto">
                                    <Download className="h-5 w-5" />
                                    Instalar Fastnet Player en este dispositivo
                                </Button>
                            </div>
                        )}
                    </InstallAction>
                    {onOpenManual && (
                        <button
                            type="button"
                            onClick={onOpenManual}
                            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 underline-offset-4 transition hover:text-white hover:underline"
                        >
                            <BookOpen className="h-4 w-4" />
                            Ver manual de usuario
                        </button>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default Downloads;
