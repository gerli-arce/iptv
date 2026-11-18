<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\TrialAccount;
use App\Services\OneStreamException;
use App\Services\OneStreamService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Prueba gratis desde la landing: registra al cliente y crea su linea en el panel 1-Stream.
 * Una prueba por DNI, por telefono y por usuario (indices unicos en trial_accounts).
 */
class TrialController extends Controller
{
    public function store(Request $request, OneStreamService $panel): JsonResponse
    {
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
        ], [
            'dni.unique' => 'Este DNI ya tiene una prueba registrada. Escríbenos por WhatsApp si necesitas ayuda.',
            'phone.unique' => 'Este número ya tiene una prueba registrada.',
            'phone.regex' => 'Ingresa un celular válido de 9 dígitos que empiece con 9.',
            'username.unique' => 'Ese nombre de usuario ya está en uso. Elige otro.',
            'username.regex' => 'El usuario debe tener de 4 a 20 letras minúsculas o números, sin espacios.',
            'password.regex' => 'La contraseña no puede tener espacios.',
        ]);

        if (! $panel->isConfigured()) {
            Log::error('Prueba gratis: faltan ONESTREAM_API_URL / ONESTREAM_API_TOKEN / ONESTREAM_USER_TOKEN');

            return response()->json(['message' => 'Las pruebas gratis no están disponibles en este momento.'], 503);
        }

        $expiresAt = now()->addDays(config('services.onestream.trial_days'));

        // Se reserva primero el registro: si dos solicitudes llegan a la vez con el mismo DNI, el indice unico frena a la segunda.
        try {
            $trial = TrialAccount::create([
                ...collect($data)->except('password')->map(fn ($value) => is_string($value) ? trim($value) : $value)->all(),
                'expires_at' => $expiresAt,
                'ip' => $request->ip(),
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'Ya existe una prueba con estos datos.'], 422);
        }

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
                "Prueba web 30d - {$trial->name} - DNI {$trial->dni} - Cel {$trial->phone} - {$trial->city}",
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
}
