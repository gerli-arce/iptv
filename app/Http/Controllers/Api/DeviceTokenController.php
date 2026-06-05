<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'token' => ['required', 'string', 'max:2048'],
            'platform' => ['nullable', 'string', 'max:50'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'app_version' => ['nullable', 'string', 'max:100'],
        ]);

        $deviceToken = DeviceToken::query()->firstOrNew([
            'token' => $validated['token'],
        ]);

        if (array_key_exists('user_id', $validated) && filled($validated['user_id'])) {
            $deviceToken->user_id = $validated['user_id'];
        }

        $deviceToken->platform = $validated['platform'] ?? $deviceToken->platform ?? 'android';
        $deviceToken->device_name = $validated['device_name'] ?? $deviceToken->device_name;
        $deviceToken->app_version = $validated['app_version'] ?? $deviceToken->app_version;
        $deviceToken->last_seen_at = now();
        $deviceToken->save();

        return response()->json([
            'ok' => true,
            'device_token' => $deviceToken,
        ], $deviceToken->wasRecentlyCreated ? 201 : 200);
    }
}
