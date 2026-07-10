<?php

use App\Http\Controllers\Web\PortalController;
use App\Http\Controllers\Web\ImageProxyController;
use Illuminate\Support\Facades\Route;

Route::view('/privacy-policy', 'privacy-policy')->name('privacy-policy');

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
Route::get('/app', [PortalController::class, 'showApp'])->name('app');
Route::get('/stream', [PortalController::class, 'streamProxy'])->name('stream.proxy');

foreach (['/api/player', '/portal-api'] as $prefix) {
    Route::prefix($prefix)->group(function () {
        Route::get('/me', [PortalController::class, 'apiMe']);
        Route::post('/login', [PortalController::class, 'apiLogin']);
        Route::post('/logout', [PortalController::class, 'apiLogout']);
        Route::get('/home', [PortalController::class, 'apiHome']);
        Route::get('/live', [PortalController::class, 'apiLive']);
        Route::get('/movies', [PortalController::class, 'apiMovies']);
        Route::get('/series', [PortalController::class, 'apiSeries']);
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
