<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Detras del proxy del hosting la IP real viene en X-Forwarded-For; sin esto el limite de intentos
        // contaria a todos los usuarios como una sola IP. Ajusta TRUSTED_PROXIES si el servidor esta expuesto directo.
        $proxies = (string) env('TRUSTED_PROXIES', '*');
        $middleware->trustProxies(at: $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
