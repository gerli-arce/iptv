<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ImageProxyController extends Controller
{
    public function show(Request $request)
    {
        $url = trim((string) $request->query('url', ''));

        if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL)) {
            abort(404);
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        if (! in_array($scheme, ['http', 'https'], true)) {
            abort(404);
        }

        $response = Http::withoutVerifying()->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Referer' => 'https://www.google.com/',
            'Accept' => 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ])->timeout(15)->get($url);

        if (! $response->successful()) {
            abort($response->status() >= 400 ? $response->status() : 404);
        }

        $contentType = $response->header('Content-Type', 'image/jpeg');

        return response($response->body(), 200)
            ->header('Content-Type', $contentType)
            ->header('Cache-Control', 'public, max-age=3600');
    }
}
