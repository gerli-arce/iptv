<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        if (app()->environment('production') && is_file(public_path('hot'))) {
            @unlink(public_path('hot'));
        }

        if (app()->environment('production')) {
            URL::forceScheme('https');
            Vite::useHotFile(storage_path('framework/vite.hot'));
        }
    }

    private function configureRateLimiting(): void
    {
        // Login: pocos intentos por usuario+IP y un tope mas amplio por IP (fuerza bruta / relleno de credenciales).
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by('login:' . strtolower((string) $request->input('username')) . '|' . $request->ip()),
            Limit::perMinute(20)->by('login-ip:' . $request->ip()),
        ]);

        // Rutas publicas que gastan cuota de terceros (TMDB) o aceptan datos anonimos.
        RateLimiter::for('public-api', fn (Request $request) => Limit::perMinute(60)->by($request->ip()));

        // Una pagina de catalogo pide muchas portadas a la vez.
        RateLimiter::for('image-proxy', fn (Request $request) => Limit::perMinute(300)->by($request->ip()));
    }
}
