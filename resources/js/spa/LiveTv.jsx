import { useEffect, useMemo, useState } from "react";
import { Play, Tv } from "lucide-react";
import { proxiedImageUrl } from "./helpers";
import { Row } from "./Browse";
import { CategoryNav, CategoryRow } from "./Catalog";
import { LiveBadge, LivePlayer } from "./LivePlayer";

function ChannelCard({ channel, onOpen }) {
  const logo = proxiedImageUrl(channel.stream_icon);
  return (
    <button
      onClick={() => onOpen(channel)}
      className="group block w-full text-left outline-none"
      aria-label={`Ver ${channel.name} en vivo`}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-[#3b3b45] to-[#24242c] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/35 group-focus-visible:ring-coral group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
        {logo ? (
          <img src={logo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-5" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <Tv className="size-8 text-zinc-600" />
          </div>
        )}
        <LiveBadge className="absolute left-2 top-2" />
        <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-white text-black">
            <Play className="size-5" fill="currentColor" />
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-[13px] font-medium text-zinc-100">{channel.name}</p>
    </button>
  );
}

// Canales que la gente mas ve, en el orden en que se muestran en el inicio.
const FEATURED_CHANNELS = [
  "AMERICA TV HD",
  "PANAMERICANA HD",
  "EXITOSA HD",
  "CANAL N HD",
  "DSPORTS HD",
  "DSPORTS+ HD",
  "ESPN PREMIUN HD",
  "LIGA 1 MAX HD",
  "LIGA 1 HD",
  "CLARO SPORT HD",
  "TNT SPORT PREMIUM HD",
  "MOVISTAR DEPORTES HD",
  "HBO HD",
  "CINECANAL HD",
  "DISCOVERY CHANNEL HD",
  "CNN ESPAÑOL HD",
  "NATIONAL GEOGRAPHIC HD",
  "TNT HD",
];

export function pickFeaturedChannels(channels = []) {
  const byName = new Map(channels.map((c) => [String(c.name).trim().toUpperCase(), c]));
  return FEATURED_CHANNELS.map((name) => byName.get(name)).filter(Boolean);
}

// Fila "Canales recomendados" del inicio: abre el canal en el mismo reproductor de TV en vivo.
export function FeaturedChannels({ channels = [], categories = [], getStream, player }) {
  const featured = useMemo(() => pickFeaturedChannels(channels), [channels]);
  if (!featured.length) return null;

  const activeId = player?.activeId;
  const active = activeId == null ? null : featured.find((c) => String(c.stream_id) === String(activeId)) || null;
  const step = (delta) => {
    const index = featured.findIndex((c) => String(c.stream_id) === String(activeId));
    if (index === -1) return;
    player.change(featured[(index + delta + featured.length) % featured.length].stream_id);
  };
  const categoryName = (channel) => categories.find((cat) => String(cat.category_id) === String(channel?.category_id))?.category_name;

  return (
    <>
      <Row title="Canales recomendados" subtitle="TV en vivo">
        {featured.map((channel) => (
          <div key={channel.stream_id} className="w-[190px] shrink-0 snap-start md:w-[240px]">
            <ChannelCard channel={channel} onOpen={(c) => player.open(c.stream_id)} />
          </div>
        ))}
      </Row>
      {active ? (
        <LivePlayer
          channel={active}
          categoryName={categoryName(active)}
          getStream={getStream}
          onClose={player.close}
          onStep={step}
          related={featured.filter((c) => c.stream_id !== active.stream_id)}
          onSelect={(c) => player.change(c.stream_id)}
        />
      ) : null}
    </>
  );
}

function ChannelRow({ category, channels, onOpen, onSeeAll }) {
  return (
    <CategoryRow title={category.category_name} count={channels.length} onSeeAll={onSeeAll}>
      {channels.map((channel) => (
        <div key={channel.stream_id} className="w-[168px] shrink-0 snap-start md:w-[208px]">
          <ChannelCard channel={channel} onOpen={onOpen} />
        </div>
      ))}
    </CategoryRow>
  );
}

export function LiveTv({ channels = [], categories = [], loading, error, searchQuery = "", hideUnplayable = true, getStream, onRetry, categoryId = "all", onCategoryChange, player }) {
  const setCategoryId = onCategoryChange;
  const activeId = player?.activeId;
  const q = searchQuery.trim().toLowerCase();

  // Solo se muestran los canales que se reproducen en el navegador (web_playable !== false).
  const visible = useMemo(() => channels.filter((c) => !(hideUnplayable && c.web_playable === false)), [channels, hideUnplayable]);

  const visibleCategories = useMemo(() => {
    const counts = new Map();
    visible.forEach((c) => counts.set(String(c.category_id), (counts.get(String(c.category_id)) || 0) + 1));
    return categories.filter((cat) => counts.has(String(cat.category_id))).map((cat) => ({ ...cat, count: counts.get(String(cat.category_id)) }));
  }, [visible, categories]);

  // Una categoria que no existe (enlace viejo) vuelve a "Todos"; no antes de que lleguen los canales.
  useEffect(() => {
    if (categoryId === "all" || loading || !visible.length) return;
    if (!visibleCategories.some((cat) => String(cat.category_id) === String(categoryId))) setCategoryId("all");
  }, [visibleCategories, categoryId, loading, visible.length]);

  const filtered = useMemo(
    () => visible.filter((c) => (categoryId === "all" || String(c.category_id) === String(categoryId)) && (!q || String(c.name).toLowerCase().includes(q))),
    [visible, categoryId, q],
  );

  // En "Todos" (sin busqueda) los canales se muestran en una fila por categoria.
  const grouped = categoryId === "all" && !q;
  const groups = useMemo(() => {
    if (!grouped) return [];
    return visibleCategories
      .map((cat) => ({ category: cat, channels: visible.filter((c) => String(c.category_id) === String(cat.category_id)) }))
      .filter((g) => g.channels.length);
  }, [grouped, visibleCategories, visible]);

  // Orden en pantalla, para que "anterior / siguiente" del reproductor siga lo que se ve.
  const ordered = useMemo(() => (grouped ? groups.flatMap((g) => g.channels) : filtered), [grouped, groups, filtered]);

  const active = activeId == null ? null : visible.find((c) => String(c.stream_id) === String(activeId)) || null;
  const categoryName = (channel) => categories.find((cat) => String(cat.category_id) === String(channel?.category_id))?.category_name;
  const currentCategory = visibleCategories.find((cat) => String(cat.category_id) === String(categoryId));

  const step = (delta) => {
    const list = ordered.length ? ordered : visible;
    const index = list.findIndex((c) => String(c.stream_id) === String(activeId));
    if (index === -1 || !list.length) return;
    player.change(list[(index + delta + list.length) % list.length].stream_id);
  };

  const navItems = [{ category_id: "all", category_name: "Todos", count: visible.length }, ...visibleCategories];
  const heading = q ? `Resultados para "${searchQuery.trim()}"` : currentCategory ? currentCategory.category_name : "TV en vivo";
  const total = grouped ? visible.length : filtered.length;

  return (
    <section className="px-4 pb-12 pt-24 md:px-10 md:pt-28">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">{heading}</h1>
        {!loading && !error ? <span className="text-sm text-zinc-500">{total} canales</span> : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-8 text-white">
          <p className="text-lg font-bold">No se pudieron cargar los canales</p>
          <button onClick={onRetry} className="mt-4 rounded-lg bg-coral px-5 py-2.5 font-semibold text-white transition hover:bg-coral-soft">
            Reintentar
          </button>
        </div>
      ) : null}

      {!error ? (
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {!loading && visibleCategories.length ? <CategoryNav items={navItems} value={categoryId} onChange={setCategoryId} /> : null}

          <div className="min-w-0 flex-1 space-y-8 pt-4 lg:pt-0">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="fp-skeleton aspect-video rounded-lg" />
                ))}
              </div>
            ) : null}

            {!loading && !filtered.length ? (
              <p className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-zinc-400">
                {q ? "No encontramos canales con ese nombre." : "No hay canales disponibles por ahora."}
              </p>
            ) : null}

            {!loading && grouped
              ? groups.map((g) => (
                  <ChannelRow key={g.category.category_id} category={g.category} channels={g.channels} onOpen={(c) => player.open(c.stream_id)} onSeeAll={() => setCategoryId(g.category.category_id)} />
                ))
              : null}

            {!loading && !grouped && filtered.length ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 xl:grid-cols-5">
                {filtered.map((channel) => (
                  <ChannelCard key={channel.stream_id} channel={channel} onOpen={(c) => player.open(c.stream_id)} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {active ? (
        <LivePlayer
          channel={active}
          categoryName={categoryName(active)}
          getStream={getStream}
          onClose={player.close}
          onStep={step}
          related={visible.filter((c) => String(c.category_id) === String(active.category_id) && c.stream_id !== active.stream_id)}
          onSelect={(c) => player.change(c.stream_id)}
        />
      ) : null}
    </section>
  );
}
