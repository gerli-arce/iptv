<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\UriInterface;
use Throwable;

class ImageProxyController extends Controller
{
    private const MAX_BYTES = 8 * 1024 * 1024;

    // SVG queda fuera a proposito: abierto directamente en este dominio podria ejecutar scripts.
    private const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

    public function show(Request $request)
    {
        $url = trim((string) $request->query('url', ''));

        if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL) || ! $this->isPublicUrl($url)) {
            abort(404);
        }

        try {
            $response = $this->fetch($url, verify: true);
        } catch (ConnectionException $e) {
            // Algunos servidores de portadas tienen certificados vencidos; las imagenes no son datos sensibles.
            if (! str_contains(strtolower($e->getMessage()), 'ssl')) {
                abort(502);
            }
            try {
                $response = $this->fetch($url, verify: false);
            } catch (Throwable) {
                abort(502);
            }
        } catch (Throwable) {
            abort(502);
        }

        if (! $response->successful()) {
            abort($response->status() >= 400 ? $response->status() : 404);
        }

        $contentType = strtolower(trim(explode(';', (string) $response->header('Content-Type'))[0]));
        if (! in_array($contentType, self::ALLOWED_TYPES, true)) {
            abort(415);
        }

        $declared = (int) $response->header('Content-Length');
        if ($declared > self::MAX_BYTES) {
            abort(413);
        }

        // Se lee por partes con tope de tamano para no cargar respuestas enormes en memoria.
        $stream = $response->toPsrResponse()->getBody();
        $body = '';
        while (! $stream->eof()) {
            $body .= $stream->read(65536);
            if (strlen($body) > self::MAX_BYTES) {
                abort(413);
            }
        }

        return response($body, 200)
            ->header('Content-Type', $contentType)
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    private function fetch(string $url, bool $verify)
    {
        $http = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Referer' => 'https://www.google.com/',
            'Accept' => 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ])->withOptions([
            'stream' => true,
            'allow_redirects' => [
                'max' => 3,
                'protocols' => ['http', 'https'],
                // Cada redireccion se valida igual que la URL inicial.
                'on_redirect' => function ($request, $response, UriInterface $uri): void {
                    if (! $this->isPublicUrl((string) $uri)) {
                        throw new \RuntimeException('redireccion no permitida');
                    }
                },
            ],
        ])->connectTimeout(5)->timeout(15);

        if (! $verify) {
            $http = $http->withoutVerifying();
        }

        return $http->get($url);
    }

    /**
     * Solo http/https hacia direcciones publicas: bloquea localhost, redes privadas y metadatos de la nube.
     */
    private function isPublicUrl(string $url): bool
    {
        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = $parts['host'] ?? '';

        if (! in_array($scheme, ['http', 'https'], true) || $host === '' || isset($parts['user']) || isset($parts['pass'])) {
            return false;
        }

        $host = trim($host, '[]');
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);
        if ($ips === []) {
            return false;
        }

        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return false;
            }
        }

        return true;
    }
}
