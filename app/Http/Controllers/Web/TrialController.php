<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\TrialAccount;
use App\Services\DniService;
use App\Services\OneStreamException;
use App\Services\OneStreamService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Prueba gratis desde la landing: registra al cliente y crea su linea en el panel 1-Stream.
 * Una prueba por DNI, por telefono y por usuario (indices unicos en trial_accounts).
 */
class TrialController extends Controller
{
    public function store(Request $request, OneStreamService $panel, DniService $dniService): JsonResponse
    {
        if (! self::available()) {
            return response()->json(['message' => 'Las pruebas gratis no están disponibles en este momento.'], 503);
        }

        // Campo trampa: invisible para personas, los bots suelen llenarlo.
        if (filled($request->input('website'))) {
            return response()->json(['message' => 'No pudimos procesar tu solicitud.'], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:80'],
            'dni' => ['required', 'digits:8', Rule::unique('trial_accounts', 'dni')],
            'address' => ['required', 'string', 'min:5', 'max:150'],
            'city' => ['required', 'string', 'min:2', 'max:80'],
            'phone' => ['required', 'regex:/^9\d{8}$/', Rule::unique('trial_accounts', 'phone')],
            'username' => ['required', 'regex:/^[a-z0-9]{4,20}$/', Rule::unique('trial_accounts', 'username')],
            'password' => ['required', 'string', 'min:6', 'max:30', 'regex:/^\S+$/'],
            // Identificador que el navegador genera y guarda (no hay forma de leer la MAC desde la web).
            'device_id' => ['required', 'string', 'regex:/^[A-Za-z0-9-]{16,64}$/'],
        ], [
            'device_id.*' => 'Recarga la página e inténtalo de nuevo.',
            'dni.unique' => 'Este DNI ya tiene una prueba registrada. Escríbenos por WhatsApp si necesitas ayuda.',
            'phone.unique' => 'Este número ya tiene una prueba registrada.',
            'phone.regex' => 'Ingresa un celular válido de 9 dígitos que empiece con 9.',
            'username.unique' => 'Ese nombre de usuario ya está en uso. Elige otro.',
            'username.regex' => 'El usuario debe tener de 4 a 20 letras minúsculas o números, sin espacios.',
            'password.regex' => 'La contraseña no puede tener espacios.',
        ]);

        // Limites diarios antes de gastar una consulta de DNI (se vuelven a comprobar al reservar, con candado).
        if ($limit = $this->dailyLimitReached($data['device_id'], $request->ip())) {
            return response()->json(['message' => $limit, 'daily_limit' => true], 429);
        }

        // Identidad: el DNI debe existir y el nombre escrito debe ser el de su titular (frena DNIs inventados).
        try {
            $person = $dniService->lookup($data['dni']);
        } catch (\RuntimeException) {
            return response()->json(['message' => 'No pudimos verificar tu DNI en este momento. Intenta en unos minutos.'], 503);
        }
        if ($person === null) {
            return $this->fieldError('dni', 'No encontramos este DNI. Revisa que esté bien escrito.');
        }
        if (! $dniService->nameMatches($data['name'], $person)) {
            return $this->fieldError('name', 'El nombre no coincide con el DNI. Escríbelo como figura en tu DNI.');
        }
        // Se registra el nombre oficial, no el escrito.
        $data['name'] = $person['full_name'];

        $expiresAt = now()->addDays(config('services.onestream.trial_days'));

        // Se reserva primero el registro: si dos solicitudes llegan a la vez con el mismo DNI, el indice unico frena a la segunda.
        // El candado evita que envios simultaneos superen los limites diarios entre el conteo y la reserva.
        $reserved = Cache::lock('trial:reserve', 10)->block(5, function () use ($data, $expiresAt, $request) {
            if ($limit = $this->dailyLimitReached($data['device_id'], $request->ip())) {
                return response()->json(['message' => $limit, 'daily_limit' => true], 429);
            }

            try {
                return TrialAccount::create([
                    ...collect($data)->except('password')->map(fn ($value) => is_string($value) ? trim($value) : $value)->all(),
                    'expires_at' => $expiresAt,
                    'ip' => $request->ip(),
                ]);
            } catch (UniqueConstraintViolationException) {
                return response()->json(['message' => 'Ya existe una prueba con estos datos.'], 422);
            }
        });
        if ($reserved instanceof JsonResponse) {
            return $reserved;
        }
        $trial = $reserved;

        try {
            // El usuario puede existir en el panel aunque no venga de la web (lineas creadas a mano).
            if ($panel->usernameTaken($data['username'])) {
                throw new OneStreamException('Ese nombre de usuario ya está en uso. Elige otro.', duplicateUsername: true);
            }

            $line = $panel->createTrialLine(
                $data['username'],
                $data['password'],
                $expiresAt,
                config('services.onestream.trial_bouquets'),
                implode("\n", [
                    'Prueba web ' . config('services.onestream.trial_days') . ' dias',
                    "Nombre: {$trial->name}",
                    "DNI: {$trial->dni}",
                    "Celular: {$trial->phone}",
                    "Direccion: {$trial->address}",
                    "Ciudad: {$trial->city}",
                ]),
                'web-trial-' . $trial->id . '-' . $trial->created_at->timestamp,
            );
        } catch (OneStreamException $e) {
            // Sin cuenta en el panel no hay prueba: se libera el registro para que pueda intentarlo de nuevo.
            $trial->delete();

            return response()->json(
                $e->duplicateUsername
                    ? ['message' => $e->getMessage(), 'errors' => ['username' => [$e->getMessage()]]]
                    : ['message' => $e->getMessage()],
                $e->duplicateUsername ? 422 : 502,
            );
        }

        $trial->update(['panel_line_id' => $line['id']]);

        return response()->json([
            'username' => $trial->username,
            'expires_at' => $expiresAt->toIso8601String(),
            'days' => config('services.onestream.trial_days'),
        ], 201);
    }

    /** La prueba automatica esta activa y con todas sus claves (la landing lo usa para mostrar el formulario o WhatsApp). */
    public static function available(): bool
    {
        return config('services.onestream.trial_enabled')
            && app(OneStreamService::class)->isConfigured()
            && app(DniService::class)->isConfigured();
    }

    /**
     * Mensaje si hoy (hora de Lima) ya se alcanzo algun limite de pruebas creadas: por navegador o por IP.
     * Solo cuentan las pruebas creadas (si el panel falla el registro se borra y no ocupa cupo).
     */
    private function dailyLimitReached(string $deviceId, ?string $ip): ?string
    {
        $config = config('services.onestream');
        $today = TrialAccount::where('created_at', '>=', now('America/Lima')->startOfDay()->utc());

        return match (true) {
            (clone $today)->where('device_id', $deviceId)->count() >= $config['trial_daily_per_device']
                => 'Desde este dispositivo ya se crearon las pruebas permitidas por hoy. Intenta mañana.',
            (clone $today)->where('ip', $ip)->count() >= $config['trial_daily_per_ip']
                => 'Se alcanzó el límite de pruebas desde tu conexión por hoy. Intenta mañana.',
            default => null,
        };
    }

    private function fieldError(string $field, string $message): JsonResponse
    {
        return response()->json(['message' => $message, 'errors' => [$field => [$message]]], 422);
    }
}
