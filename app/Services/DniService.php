<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Consulta de DNI en DevEx Tools (GET /person/{dni}).
 *
 * Comportamiento observado de la API: 200 con success+data si existe, 404 si no existe, y para algunos numeros
 * imposibles (p. ej. 00000000) devuelve datos de relleno. Por eso no basta con que "exista": se compara el nombre.
 */
class DniService
{
    public function isConfigured(): bool
    {
        return filled(config('services.dni.url')) && filled(config('services.dni.key'));
    }

    /**
     * Datos del titular del DNI, o null si el DNI no existe.
     *
     * @return array{full_name: string, first_name: string, last_name_paternal: string, last_name_maternal: string}|null
     *
     * @throws RuntimeException si no se pudo consultar (servicio caido, lento o con error)
     */
    public function lookup(string $dni): ?array
    {
        // Cada consulta gasta cuota: se recuerda el resultado (tambien el "no existe") un dia.
        $cached = Cache::get("dni:{$dni}");
        if ($cached !== null) {
            return $cached === false ? null : $cached;
        }

        try {
            $response = Http::baseUrl(config('services.dni.url'))
                ->withToken((string) config('services.dni.key'))
                ->acceptJson()
                ->connectTimeout(6)
                ->timeout(12)
                // Reintenta solo fallos de conexion o del servidor; un 404 ("no existe") es una respuesta valida.
                ->retry(2, 500, fn (Throwable $e) => ! ($e instanceof RequestException && $e->response->clientError()), throw: false)
                ->get("person/{$dni}");
        } catch (Throwable $e) {
            Log::warning('Consulta DNI: sin respuesta del servicio', ['error' => $e->getMessage()]);
            throw new RuntimeException('Servicio de DNI no disponible', previous: $e);
        }

        if ($response->status() === 404) {
            Cache::put("dni:{$dni}", false, now()->addDay());

            return null;
        }

        $data = $response->json('data');
        if (! $response->successful() || $response->json('success') !== true || ! is_array($data)) {
            Log::warning('Consulta DNI: respuesta inesperada', ['status' => $response->status()]);
            throw new RuntimeException('Servicio de DNI no disponible');
        }

        $person = [
            'full_name' => (string) ($data['full_name'] ?? ''),
            'first_name' => (string) ($data['first_name'] ?? ''),
            'last_name_paternal' => (string) ($data['last_name_paternal'] ?? ''),
            'last_name_maternal' => (string) ($data['last_name_maternal'] ?? ''),
        ];
        Cache::put("dni:{$dni}", $person, now()->addDay());

        return $person;
    }

    /**
     * El nombre escrito corresponde al titular: todas sus palabras estan en el nombre oficial (sin importar tildes,
     * mayusculas ni orden), con al menos un nombre y un apellido. Permite omitir segundo nombre o apellido materno.
     *
     * @param  array{first_name: string, last_name_paternal: string, last_name_maternal: string}  $person
     */
    public function nameMatches(string $typed, array $person): bool
    {
        $typedWords = $this->words($typed);
        $givenNames = $this->words($person['first_name']);
        $surnames = [...$this->words($person['last_name_paternal']), ...$this->words($person['last_name_maternal'])];

        if (count($typedWords) < 2 || $givenNames === [] || $surnames === []) {
            return false;
        }

        $official = [...$givenNames, ...$surnames];

        return array_diff($typedWords, $official) === []
            && array_intersect($typedWords, $givenNames) !== []
            && array_intersect($typedWords, $surnames) !== [];
    }

    /** @return list<string> palabras en mayusculas, sin tildes ni signos */
    private function words(string $text): array
    {
        $clean = preg_replace('/[^A-Z ]/', ' ', Str::upper(Str::ascii($text)));

        return array_values(array_filter(explode(' ', (string) $clean)));
    }
}
