<?php

return [
    // Servidor Xtream al que se conectan todos los usuarios. El cliente no puede elegirlo (evita SSRF / relay abierto).
    'server_url' => env('IPTV_SERVER_URL', 'http://iptv.fastnetperu.com.pe:80'),
    'catalog_server_url' => env('XTREAM_CATALOG_SERVER_URL'),
    'catalog_username' => env('XTREAM_CATALOG_USERNAME'),
    'catalog_password' => env('XTREAM_CATALOG_PASSWORD'),
];
