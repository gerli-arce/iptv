<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\Admin\SectionItemController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\ImdbController;
use Illuminate\Support\Facades\Route;

Route::post('/device-tokens', [DeviceTokenController::class, 'store']);

Route::get("/home", [HomeController::class, "index"]);
Route::get("/imdb/search", [ImdbController::class, "search"]);
Route::get("/imdb/movie/{id}", [ImdbController::class, "movie"]);
Route::get("/imdb/series/{id}", [ImdbController::class, "series"]);

Route::prefix("admin")->group(function () {
    Route::post("/login", [AuthController::class, "login"]);

    Route::middleware("auth:sanctum")->group(function () {
        Route::post("/logout", [AuthController::class, "logout"]);

        Route::apiResource("banners", BannerController::class);
        Route::apiResource("home-sections", SectionController::class)->parameters([
            "home-sections" => "section",
        ]);

        Route::get("home-sections/{section}/items", [SectionItemController::class, "indexBySection"]);
        Route::post("home-sections/{section}/items", [SectionItemController::class, "store"]);
        Route::put("home-sections/{section}/items/{item}", [SectionItemController::class, "update"]);
        Route::delete("home-sections/{section}/items/{item}", [SectionItemController::class, "destroy"]);
    });
});
