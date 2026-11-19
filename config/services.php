<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'tmdb' => [
        'key' => env('TMDB_API_KEY'),
        'verify_ssl' => filter_var(env('TMDB_VERIFY_SSL', env('APP_ENV') !== 'local'), FILTER_VALIDATE_BOOL),
    ],

    // Consulta de DNI (DevEx Tools: GET {url}/person/{dni} con Authorization: Bearer). Valida la identidad de la prueba gratis.
    'dni' => [
        'url' => rtrim((string) env('DNI_API_URL', 'https://tools.devex.pe/api/v1'), '/'),
        'key' => env('DNI_API_KEY'),
    ],

    // Panel 1-Stream (API "ext"/B2C): alta automatica de cuentas de prueba desde la landing.
    'onestream' => [
        // Interruptor de la prueba automatica (TRIAL_ENABLED=false la apaga). Solo se ofrece si ademas estan las claves de
        // 1-Stream y de DNI (ver TrialController::available); si no, la landing usa la demo por WhatsApp.
        'trial_enabled' => filter_var(env('TRIAL_ENABLED', true), FILTER_VALIDATE_BOOL),
        'url' => rtrim((string) env('ONESTREAM_API_URL', ''), '/'),
        'api_token' => env('ONESTREAM_API_TOKEN'),
        'user_token' => env('ONESTREAM_USER_TOKEN'),
        'verify_ssl' => filter_var(env('ONESTREAM_VERIFY_SSL', true), FILTER_VALIDATE_BOOL),
        'trial_days' => (int) env('ONESTREAM_TRIAL_DAYS', 30),
        // Pruebas creadas por dia (hora de Lima): por navegador y por IP (por si abren otro navegador en el mismo lugar).
        'trial_daily_per_device' => (int) env('TRIAL_DAILY_PER_DEVICE', 2),
        'trial_daily_per_ip' => (int) env('TRIAL_DAILY_PER_IP', 4),
        // IDs de bouquets del panel: 2 BASICO, 3 PELICULAS, 4 SERIES, 5 PELICULAS DE ESTRENO.
        'trial_bouquets' => array_values(array_filter(array_map('intval', explode(',', (string) env('ONESTREAM_TRIAL_BOUQUETS', '2,3,4,5'))))),
    ],

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
