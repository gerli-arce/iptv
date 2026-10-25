<?php

namespace App\Services;

/**
 * Peliculas y series que un navegador no puede reproducir bien (por ejemplo audio AC3/DTS: se ve pero no suena).
 *
 * Las listas salen de scripts/scan_movie_compat.py y se guardan en resources/data/movie-compat.json y
 * resources/data/series-compat.json. Lo que no aparece en la lista (por ejemplo contenido nuevo) se considera
 * reproducible.
 */
class MovieCompatService
{
    /** @var array<string, string>|null */
    private ?array $unplayable = null;

    /** @var array<string, mixed>|null */
    private ?array $seriesData = null;

    /**
     * @return array<string, string> stream_id => motivo
     */
    public function unplayable(): array
    {
        if ($this->unplayable !== null) {
            return $this->unplayable;
        }

        $data = $this->readJson('movie-compat.json');

        return $this->unplayable = is_array($data['unplayable'] ?? null) ? $data['unplayable'] : [];
    }

    /**
     * Agrega web_playable=false a las peliculas que el navegador no puede reproducir bien.
     *
     * @param array<int, mixed> $items
     * @return array<int, mixed>
     */
    public function annotate(array $items): array
    {
        return $this->mark($items, 'stream_id', $this->unplayable());
    }

    /**
     * @return array<string, string> id de episodio => motivo
     */
    public function unplayableEpisodes(): array
    {
        $episodes = $this->seriesData()['unplayable'] ?? [];

        return is_array($episodes) ? $episodes : [];
    }

    /**
     * Series que no se pueden ver en el navegador: todos sus episodios fallan o no tienen episodios.
     *
     * @return array<string, string> series_id => motivo
     */
    public function unplayableSeries(): array
    {
        $data = $this->seriesData();
        $badEpisodes = $this->unplayableEpisodes();
        $result = [];

        foreach (($data['series_episodes'] ?? []) as $seriesId => $episodeIds) {
            if (! is_array($episodeIds) || $episodeIds === []) {
                continue;
            }
            $good = array_filter($episodeIds, fn ($id) => ! isset($badEpisodes[(string) $id]));
            if ($good === []) {
                $result[(string) $seriesId] = 'todos los episodios sin audio compatible';
            }
        }

        foreach (($data['series_without_episodes'] ?? []) as $seriesId) {
            $result[(string) $seriesId] = 'sin episodios';
        }

        return $result;
    }

    /**
     * @param array<int, mixed> $items
     * @return array<int, mixed>
     */
    public function annotateSeries(array $items): array
    {
        return $this->mark($items, 'series_id', $this->unplayableSeries());
    }

    /**
     * Quita los episodios que el navegador no reproduce. Si no quedaria ninguno, devuelve la lista completa
     * (por ejemplo para quien reproduce con VLC).
     *
     * @param array<int, array<string, mixed>> $episodes
     * @return array<int, array<string, mixed>>
     */
    public function playableEpisodes(array $episodes): array
    {
        $bad = $this->unplayableEpisodes();
        if ($bad === []) {
            return $episodes;
        }

        $good = array_values(array_filter($episodes, fn ($episode) => ! isset($bad[(string) ($episode['id'] ?? '')])));

        return $good === [] ? $episodes : $good;
    }

    /**
     * @param array<int, mixed> $items
     * @param array<string, string> $unplayable
     * @return array<int, mixed>
     */
    private function mark(array $items, string $key, array $unplayable): array
    {
        if ($unplayable === []) {
            return $items;
        }

        foreach ($items as $index => $item) {
            if (is_array($item) && isset($unplayable[(string) ($item[$key] ?? '')])) {
                $items[$index]['web_playable'] = false;
            }
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    private function seriesData(): array
    {
        return $this->seriesData ??= $this->readJson('series-compat.json');
    }

    /**
     * @return array<string, mixed>
     */
    private function readJson(string $file): array
    {
        $path = resource_path('data/' . $file);
        $data = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;

        return is_array($data) ? $data : [];
    }
}
