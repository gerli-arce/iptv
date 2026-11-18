<?php

namespace App\Services;

use RuntimeException;
use Throwable;

class OneStreamException extends RuntimeException
{
    public function __construct(string $message, public readonly bool $duplicateUsername = false, ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}
