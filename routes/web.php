<?php

use App\Http\Controllers\Web\PortalController;
use App\Http\Controllers\Web\ImageProxyController;
use App\Http\Controllers\Web\SeoController;
use Illuminate\Support\Facades\Route;

Route::get('/robots.txt', [SeoController::class, 'robots'])->name('seo.robots');
Route::get('/sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');
Route::view('/privacy-policy', 'privacy-policy')->name('privacy-policy');
Route::view('/tv-privacy-policy', 'tv-privacy-policy')->name('tv-privacy-policy');
Route::view('/data-deletion', 'data-deletion')->name('data-deletion');

if (env('APP_TARGET', 'player') === 'admin') {
    Route::redirect('/', '/admin');
    Route::redirect('/login', '/admin/login')->name('login');
    Route::redirect('/app', '/admin')->name('app');
    Route::redirect('/panel', '/admin')->name('portal.dashboard');
    Route::redirect('/panel/live', '/admin')->name('portal.live');
    Route::redirect('/panel/movies', '/admin')->name('portal.movies');
    Route::redirect('/panel/series', '/admin')->name('portal.series');
    Route::redirect('/panel/{any?}', '/admin')->where('any', '.*');

    return;
}

Route::get('/', [PortalController::class, 'landing'])->name('landing');
Route::get('/login', [PortalController::class, 'showLogin'])->name('login');
// La app es de una sola pagina, pero cada vista tiene su URL (/app/tv, /app/peliculas...): todas cargan la misma app.
Route::get('/app/{path?}', [PortalController::class, 'showApp'])->where('path', '.*')->name('app');
Route::get('/stream', [PortalController::class, 'streamProxy'])->name('stream.proxy');

foreach (['/api/player', '/portal-api'] as $prefix) {
    Route::prefix($prefix)->group(function () {
        Route::get('/me', [PortalController::class, 'apiMe']);
        Route::post('/login', [PortalController::class, 'apiLogin']);
        Route::post('/logout', [PortalController::class, 'apiLogout']);
        Route::get('/home', [PortalController::class, 'apiHome']);
        Route::get('/home-feed', [PortalController::class, 'apiHomeFeed']);
        Route::get('/live', [PortalController::class, 'apiLive']);
        Route::get('/live/{id}', [PortalController::class, 'apiLiveStream'])->whereNumber('id');
        Route::get('/movies', [PortalController::class, 'apiMovies']);
        Route::get('/series', [PortalController::class, 'apiSeries']);
        Route::get('/info/series/{id}/season/{season}', [PortalController::class, 'apiSeriesSeason'])->whereNumber(['id', 'season']);
        Route::get('/related/{type}/{id}', [PortalController::class, 'apiRelated'])->whereIn('type', ['movie', 'series'])->whereNumber('id');
        Route::get('/info/{type}/{id}', [PortalController::class, 'apiTitleInfo'])->whereIn('type', ['movie', 'series'])->whereNumber('id');
    });
}

Route::redirect('/panel', '/app')->name('portal.dashboard');
Route::redirect('/panel/live', '/app')->name('portal.live');
Route::redirect('/panel/movies', '/app')->name('portal.movies');
Route::redirect('/panel/series', '/app')->name('portal.series');
Route::redirect('/panel/{any?}', '/app')->where('any', '.*');
Route::get('/play/series/{seriesId}/{episodeId?}', [PortalController::class, 'playSeries'])->name('portal.play.series');
Route::get('/play/{type}/{id}', [PortalController::class, 'play'])
    ->whereIn('type', ['channel', 'movie'])
    ->name('portal.play');
Route::get('/image-proxy', [ImageProxyController::class, 'show'])->name('image.proxy');
