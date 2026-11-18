<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Cliente de la API "ext" ([B2B] Billing API) del panel 1-Stream.
 * Doc: billing.1-stream.com > Knowledgebase > API > "[B2B] Billing API".
 *
 * Autenticacion: X-Api-Key (token de la aplicacion) + X-Auth-User (token del usuario dueno de las lineas).
 */
class OneStreamService
{
    public function isConfigured(): bool
    {
        $config = config('services.onestream');

        return filled($config['url']) && filled($config['api_token']) && filled($config['user_token']);
    }

    /** El panel solo admite usuarios unicos: true si ya existe una linea con ese usuario. */
    public function usernameTaken(string $username): bool
    {
        return $this->get('ext/lines', ['username' => $username]) !== [];
    }

    /**
     * Crea una linea de prueba (usuario/contrasena para la app) con vencimiento y bouquets.
     * Usa create-advanced: no requiere paquete ni gasta creditos (solo admin; el usuario del token debe tener createLines).
     *
     * @param  list<int>  $bouquets
     * @return array{id: string|null, expire_at: string|null}
     *
     * @throws OneStreamException cuando el panel rechaza la peticion
     */
    public function createTrialLine(string $username, string $password, \DateTimeInterface $expiresAt, array $bouquets, string $notes, string $rid): array
    {
        $data = $this->post('ext/line/create-advanced', [
            'username' => $username,
            'password' => $password,
            'expire_at' => $expiresAt->format(DATE_ATOM),
            'is_trial' => true,
            'is_enabled' => true,
            'max_connections' => 1,
            'bouquets' => $bouquets,
            'reseller_notes' => $notes,
            // Evita crear la linea dos veces si la peticion se repite.
            'rid' => $rid,
        ]);

        return [
            'id' => isset($data['line_id']) ? (string) $data['line_id'] : null,
            'expire_at' => $data['expire_at'] ?? null,
        ];
    }

    private function client(): PendingRequest
    {
        $config = config('services.onestream');

        return Http::baseUrl($config['url'])
            ->withOptions(['verify' => $config['verify_ssl']])
            ->withHeaders($this->authHeaders())
            ->acceptJson()
            ->timeout(20)
            ->connectTimeout(8);
    }

    /** @return array<string, string> */
    private function authHeaders(): array
    {
        $config = config('services.onestream');

        return [
            'X-Api-Key' => (string) $config['api_token'],
            'X-Auth-User' => (string) $config['user_token'],
        ];
    }

    /** @return array<mixed> */
    private function get(string $path, array $query = []): array
    {
        return $this->send(fn () => $this->client()->get($path, $query), $path);
    }

    /** @return array<string, mixed> */
    private function post(string $path, array $payload): array
    {
        return $this->send(fn () => $this->client()->asJson()->post($path, $payload), $path);
    }

    /** @return array<mixed> */
    private function send(\Closure $request, string $path): array
    {
        try {
            $response = $request();
        } catch (Throwable $e) {
            Log::error('1-Stream: sin respuesta del panel', ['path' => $path, 'error' => $e->getMessage()]);
            throw new OneStreamException('No pudimos conectar con el servidor de cuentas. Intenta en unos minutos.', previous: $e);
        }

        $data = $response->json();
        $data = is_array($data) ? $data : [];

        // El panel responde 200 con {"error": "..."} cuando rechaza la peticion.
        if ($response->failed() || isset($data['error'])) {
            $error = is_string($data['error'] ?? null) ? $data['error'] : ($data['message'] ?? 'HTTP ' . $response->status());
            Log::warning('1-Stream: peticion rechazada', ['path' => $path, 'status' => $response->status(), 'error' => $error, 'errors' => $data['errors'] ?? null]);

            throw new OneStreamException(
                $this->looksLikeDuplicateUsername($data)
                    ? 'Ese nombre de usuario ya está en uso. Elige otro.'
                    : 'No pudimos crear tu cuenta en este momento. Intenta en unos minutos.',
                duplicateUsername: $this->looksLikeDuplicateUsername($data),
            );
        }

        return $data;
    }

    private function looksLikeDuplicateUsername(array $data): bool
    {
        $text = strtolower(json_encode([$data['error'] ?? null, $data['message'] ?? null, $data['errors']['username'] ?? null]) ?: '');

        return str_contains($text, 'username') && (str_contains($text, 'taken') || str_contains($text, 'exist') || str_contains($text, 'already'));
    }
}
