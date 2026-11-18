<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pruebas creadas desde la landing. DNI, telefono y usuario son unicos: una prueba por persona.
     * La contrasena no se guarda (solo vive en el panel).
     */
    public function up(): void
    {
        Schema::create('trial_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->char('dni', 8)->unique();
            $table->string('address', 150);
            $table->string('city', 80);
            $table->string('phone', 9)->unique();
            $table->string('username', 20)->unique();
            $table->string('panel_line_id')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_accounts');
    }
};
