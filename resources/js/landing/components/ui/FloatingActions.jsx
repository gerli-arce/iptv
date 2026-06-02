import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

const FloatingActions = ({ onOpenManual }) => {
    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-row items-center gap-3">
            <motion.button
                onClick={onOpenManual}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-14 min-w-[5rem] flex-col items-center justify-center rounded-xl border border-orange-500/30 bg-orange-600 p-2 text-white shadow-lg shadow-orange-600/20 backdrop-blur-sm transition-colors hover:bg-orange-500 hover:border-orange-400"
                title="Ver Manual de Usuario"
            >
                <BookOpen className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Manual</span>
            </motion.button>

            <motion.a
                href="https://wa.me/51942059874?text=Hola%2C%20estoy%20interesado%20en%20el%20servicio%20IPTV%20de%20FASTNET%20TV.%20%C2%BFPodr%C3%ADan%20brindarme%20m%C3%A1s%20informaci%C3%B3n%3F"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-green-500/30 bg-[#25D366] p-2 shadow-lg shadow-green-500/20 transition-colors hover:bg-[#20bd5a] hover:border-green-400"
                title="Chat en WhatsApp"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="white"
                    className="h-8 w-8"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </motion.a>
        </div>
    );
};

export default FloatingActions;
