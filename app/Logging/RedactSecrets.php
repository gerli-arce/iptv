<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Formatter\LineFormatter;
use Monolog\Handler\FormattableHandlerInterface;
use Monolog\LogRecord;

/**
 * Tap de logging: oculta usuario y contrasena del panel IPTV, que aparecen en las URLs de los errores de cURL
 * (player_api.php?username=..&password=.. y /live/usuario/clave/id.m3u8).
 */
class RedactSecrets
{
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getLogger()->getHandlers() as $handler) {
            if ($handler instanceof FormattableHandlerInterface) {
                $handler->setFormatter(new RedactingFormatter(null, null, true, true));
            }
        }
    }
}
