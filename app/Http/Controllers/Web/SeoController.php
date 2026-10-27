<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    /**
     * robots.txt: permite indexar la pagina publica y deja fuera la app y los endpoints internos. /login no se bloquea
     * a proposito: Google tiene que poder abrirlo para leer su "noindex" y quitarlo de los resultados (si estuviera
     * bloqueado, se quedaria el resultado viejo).
     */
    public function robots(): Response
    {
        $base = $this->siteUrl();

        $lines = [
            'User-agent: *',
            'Allow: /',
            'Disallow: /app',
            'Disallow: /panel',
            'Disallow: /play/',
            'Disallow: /stream',
            'Disallow: /image-proxy',
            'Disallow: /api/',
            'Disallow: /portal-api/',
            '',
            "Sitemap: {$base}/sitemap.xml",
            '',
        ];

        return response(implode("\n", $lines), 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    /**
     * sitemap.xml con las paginas publicas indexables.
     */
    public function sitemap(): Response
    {
        $base = $this->siteUrl();
        $lastmod = date('Y-m-d', (int) filemtime(resource_path('views/landing.blade.php')));

        $pages = [
            ['/', '1.0', 'weekly'],
            ['/privacy-policy', '0.3', 'yearly'],
            ['/tv-privacy-policy', '0.3', 'yearly'],
            ['/data-deletion', '0.3', 'yearly'],
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($pages as [$path, $priority, $changefreq]) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>' . htmlspecialchars($base . ($path === '/' ? '/' : $path), ENT_XML1) . "</loc>\n";
            $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
            $xml .= "    <changefreq>{$changefreq}</changefreq>\n";
            $xml .= "    <priority>{$priority}</priority>\n";
            $xml .= "  </url>\n";
        }
        $xml .= '</urlset>' . "\n";

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    private function siteUrl(): string
    {
        return rtrim((string) config('app.site_url'), '/');
    }
}
