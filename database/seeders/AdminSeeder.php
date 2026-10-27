<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ADMIN_EMAIL', 'admin@fastnet.tv');

        // Si el admin ya existe no se toca: antes cada `db:seed` le volvia a poner la clave fija.
        if (Admin::query()->where('email', $email)->exists()) {
            return;
        }

        $password = (string) env('ADMIN_PASSWORD', '');
        $generated = $password === '';
        if ($generated) {
            $password = Str::password(16, symbols: false);
        }

        Admin::query()->create([
            'email' => $email,
            'name' => 'admin',
            'password' => $password,
        ]);

        if ($generated) {
            $this->command?->warn("Admin creado: {$email} / {$password}  (guarda esta clave, no se vuelve a mostrar)");
        }
    }
}
