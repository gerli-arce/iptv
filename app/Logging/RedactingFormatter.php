<?php

namespace App\Logging;

use Monolog\Formatter\LineFormatter;
use Monolog\LogRecord;

class RedactingFormatter extends LineFormatter
{
    public function format(LogRecord $record): string
    {
        return self::redact(parent::format($record));
    }

    public static function redact(string $text): string
    {
        $text = preg_replace('/\b(username|password)=[^&\s"\')]+/i', '$1=***', $text) ?? $text;

        return preg_replace('#/(live|movie|series)/[^/\s"\']+/[^/\s"\']+/#i', '/$1/***/***/', $text) ?? $text;
    }
}
