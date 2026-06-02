<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class XtreamService
{
    public function login(string $serverUrl, string $username, string $password): array
    {
        return $this->request($serverUrl, $username, $password);
    }

    public function getLiveStreams(string $serverUrl, string $username, string $password): array
    {
        return $this->request($serverUrl, $username, $password, [
            'action' => 'get_live_streams',
        ]);
    }

    public function getLiveCategories(string $serverUrl, string $username, string $password): array
    {
        return $this->request($serverUrl, $username, $password, [
            'action' => 'get_live_categories',
        ]);
    }

    public function getVodStreams(string $serverUrl, string $username, string $password): array
    {
        return $this->request($serverUrl, $username, $password, [
            'action' => 'get_vod_streams',
        ]);
    }

    public function getVodCategories(string $serverUrl, string $username, string $password): array
    {
        return $this->request($serverUrl, $username, $password, [
            'action' => 'get_vod_categories',
        ]);
    }

    public function getSeries(string $serverUrl, string $username, string $password): array
    {
        return $this->request($serverUrl, $username, $password, [
            'action' => 'get_series',
        ]);
    }

    public function getSeriesCategories(string $serverUrl, string $username, string $password): array
    {
        return $this->request($serverUrl, $username, $password, [
            'action' => 'get_series_categories',
        ]);
    }

    public function getSeriesInfo(string $serverUrl, string $username, string $password, int|string $seriesId): array
    {
        return $this->request($serverUrl, $username, $password, [
            'action' => 'get_series_info',
            'series_id' => $seriesId,
        ]);
    }

    protected function request(string $serverUrl, string $username, string $password, array $params = []): array
    {
        $serverUrl = rtrim($serverUrl, '/');

        $query = array_merge([
            'username' => $username,
            'password' => $password,
        ], $params);

        $response = Http::timeout(30)->get("{$serverUrl}/player_api.php", $query);

        if (! $response->successful()) {
            return [];
        }

        $data = $response->json();
        return is_array($data) ? $data : [];
    }
}
