<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            "login" => ["required", "string"],
            "password" => ["required", "string"],
        ]);

        $admin = Admin::query()
            ->where("email", $credentials["login"])
            ->orWhere("name", $credentials["login"])
            ->first();

        if (! $admin || ! Hash::check($credentials["password"], $admin->password)) {
            throw ValidationException::withMessages([
                "login" => ["Las credenciales son inválidas."],
            ]);
        }

        $token = $admin->createToken("admin-token")->plainTextToken;

        return response()->json([
            "token" => $token,
            "admin" => $admin,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            "message" => "Sesión cerrada correctamente.",
        ]);
    }
}
