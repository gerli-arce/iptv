import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Piezas compartidas por TV en vivo, Peliculas y Series: menu de categorias y fila por categoria.

// Fila horizontal de una categoria: titulo con cantidad, "Ver todos" y flechas al pasar el raton.
export function CategoryRow({ title, count, onSeeAll, children }) {
  const scroller = useRef(null);
  const scrollBy = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="group/row space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h2 className="truncate text-lg font-bold tracking-[-0.01em] text-white md:text-xl">{title}</h2>
          <span className="font-mono text-xs text-zinc-500">{count}</span>
        </div>
        <button onClick={onSeeAll} className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-zinc-400 transition hover:text-white">
          Ver todos
          <ChevronRight className="size-3.5" />
        </button>
      </div>
      <div className="relative">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Anterior"
          className="absolute -left-3 top-0 z-10 hidden h-[calc(100%-2.5rem)] w-10 items-center justify-center bg-gradient-to-r from-[#08080b] to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
        >
          <ChevronLeft className="size-7" />
        </button>
        <div ref={scroller} className="fp-no-scrollbar -mx-4 flex snap-x scroll-pl-4 gap-3 overflow-x-auto scroll-smooth px-4 pb-1 md:mx-0 md:scroll-pl-0 md:px-0">
          {children}
        </div>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Siguiente"
          className="absolute -right-3 top-0 z-10 hidden h-[calc(100%-2.5rem)] w-10 items-center justify-center bg-gradient-to-l from-[#08080b] to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
        >
          <ChevronRight className="size-7" />
        </button>
      </div>
    </section>
  );
}

// items: [{ category_id, category_name, count }]. En escritorio es una lista fija a la izquierda;
// en movil y tablet, una fila deslizable que se queda fija bajo el menu.
export function CategoryNav({ items, value, onChange }) {
  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="fp-no-scrollbar sticky top-24 max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto pr-2" aria-label="Categorias">
          <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Categorias</p>
          {items.map((cat) => {
            const active = String(value) === String(cat.category_id);
            return (
              <button
                key={cat.category_id}
                onClick={() => onChange(cat.category_id)}
                className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active ? "bg-white/[0.08] font-semibold text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-coral" /> : null}
                <span className="truncate">{cat.category_name}</span>
                <span className={`font-mono text-xs ${active ? "text-zinc-300" : "text-zinc-600"}`}>{cat.count}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="sticky top-16 z-30 -mx-4 border-b border-white/[0.06] bg-[#08080b]/90 backdrop-blur-xl md:top-[72px] md:-mx-10 lg:hidden">
        <div className="fp-no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5 md:px-10">
          {items.map((cat) => {
            const active = String(value) === String(cat.category_id);
            return (
              <button
                key={cat.category_id}
                onClick={() => onChange(cat.category_id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
                  active ? "bg-white text-black" : "bg-white/[0.06] text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat.category_name}
                <span className={`ml-1.5 font-mono text-[11px] ${active ? "text-black/50" : "text-zinc-500"}`}>{cat.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
