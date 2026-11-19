<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Identificador del navegador que creo la prueba (limite de pruebas por dispositivo y por dia).
     * Los indices aceleran los conteos diarios por dispositivo, IP y total.
     */
    public function up(): void
    {
        Schema::table('trial_accounts', function (Blueprint $table) {
            $table->string('device_id', 64)->nullable()->after('ip');
            $table->index(['device_id', 'created_at']);
            $table->index(['ip', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('trial_accounts', function (Blueprint $table) {
            $table->dropIndex(['device_id', 'created_at']);
            $table->dropIndex(['ip', 'created_at']);
            $table->dropIndex(['created_at']);
            $table->dropColumn('device_id');
        });
    }
};
