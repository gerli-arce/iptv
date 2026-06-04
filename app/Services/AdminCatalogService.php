<?php

namespace App\Services;

use App\Models\AppSetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class AdminCatalogService
{
    public function __construct(
        private readonly XtreamService $xtreamService
    ) {
    }

    public function hasCredentials(): bool
    {
        [$serverUrl, $username, $password] = $this->credentials();

        return filled($serverUrl) && filled($username) && filled($password);
    }

    public function credentials(): array
    {
        $sessionCredentials = [
            session('iptv.server_url'),
            session('iptv.username'),
            session('iptv.password'),
        ];

        if (filled($sessionCredentials[0]) && filled($sessionCredentials[1]) && filled($sessionCredentials[2])) {
            return $sessionCredentials;
        }

        $settings = AppSetting::query()
            ->whereIn('key', [
                'catalog_server_url',
                'catalog_username',
                'catalog_password',
            ])
            ->pluck('value', 'key')
            ->all();

        return [
            $this->settingValue('catalog_server_url', $settings['catalog_server_url'] ?? null, config('xtream.catalog_server_url')),
            $this->settingValue('catalog_username', $settings['catalog_username'] ?? null, config('xtream.catalog_username')),
            $this->settingValue('catalog_password', $settings['catalog_password'] ?? null, config('xtream.catalog_password')),
        ];
    }

    public function searchOptions(string $contentType, string $search, int $limit = 25): array
    {
        $items = $this->searchItems($contentType, $search, $limit);

        return $items
            ->mapWithKeys(function (array $item) use ($contentType) {
                $id = $this->itemId($contentType, $item);

                if (blank($id)) {
                    return [];
                }

                return [$id => $this->formatOptionLabel($contentType, $item)];
            })
            ->all();
    }

    public function optionLabel(string $contentType, ?string $externalId): ?string
    {
        if (blank($externalId)) {
            return null;
        }

        $item = $this->findItem($contentType, $externalId);

        if (! $item) {
            return $externalId;
        }

        return $this->formatOptionLabel($contentType, $item);
    }

    public function findItem(string $contentType, ?string $externalId): ?array
    {
        if (blank($externalId)) {
            return null;
        }

        $items = $this->cachedItems($contentType);

        return collect($items)->first(function (array $item) use ($contentType, $externalId) {
            return (string) $this->itemId($contentType, $item) === (string) $externalId;
        });
    }

    public function itemTitle(array $item, string $contentType): string
    {
        return (string) (
            $item['name']
            ?? $item['title']
            ?? $item['series_name']
            ?? $item['custom_name']
            ?? $this->itemId($contentType, $item)
            ?? 'Contenido'
        );
    }

    public function itemImage(array $item): ?string
    {
        foreach (['stream_icon', 'cover_big', 'cover', 'poster', 'movie_image', 'backdrop_path', 'image'] as $key) {
            $value = $item[$key] ?? null;

            if (filled($value)) {
                return (string) $value;
            }
        }

        return null;
    }

    protected function searchItems(string $contentType, string $search, int $limit): Collection
    {
        $query = mb_strtolower(trim($search));

        return collect($this->cachedItems($contentType))
            ->filter(function (array $item) use ($contentType, $query) {
                if ($query === '') {
                    return true;
                }

                $haystack = mb_strtolower(implode(' ', array_filter([
                    $this->itemId($contentType, $item),
                    $item['name'] ?? null,
                    $item['title'] ?? null,
                    $item['series_name'] ?? null,
                ])));

                return str_contains($haystack, $query);
            })
            ->sortBy(function (array $item) use ($contentType, $query) {
                $label = mb_strtolower($this->formatOptionLabel($contentType, $item));
                $startsWith = $query !== '' && str_starts_with($label, $query) ? 0 : 1;

                return sprintf('%d|%s', $startsWith, $label);
            })
            ->take($limit)
            ->values();
    }

    protected function cachedItems(string $contentType): array
    {
        [$serverUrl, $username, $password] = $this->credentials();

        if (! filled($serverUrl) || ! filled($username) || ! filled($password)) {
            return [];
        }

        $cacheKey = 'admin-catalog:' . md5(implode('|', [$contentType, $serverUrl, $username, $password]));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($contentType, $serverUrl, $username, $password) {
            return match ($contentType) {
                'live' => $this->xtreamService->getLiveStreams($serverUrl, $username, $password),
                'movie' => $this->xtreamService->getVodStreams($serverUrl, $username, $password),
                'series' => $this->xtreamService->getSeries($serverUrl, $username, $password),
                default => [],
            };
        });
    }

    protected function itemId(string $contentType, array $item): string|int|null
    {
        return match ($contentType) {
            'series' => $item['series_id'] ?? $item['id'] ?? $item['stream_id'] ?? null,
            default => $item['stream_id'] ?? $item['id'] ?? null,
        };
    }

    protected function formatOptionLabel(string $contentType, array $item): string
    {
        $title = $this->itemTitle($item, $contentType);
        $id = $this->itemId($contentType, $item);
        $suffix = filled($id) ? " #{$id}" : '';
        $category = $item['category_name'] ?? $item['genre'] ?? null;

        if (filled($category)) {
            return "{$title}{$suffix} · {$category}";
        }

        return "{$title}{$suffix}";
    }

    protected function settingValue(string $key, mixed $stored, mixed $fallback): mixed
    {
        if (filled($stored)) {
            return $stored;
        }

        return filled($fallback) ? $fallback : null;
    }
}
