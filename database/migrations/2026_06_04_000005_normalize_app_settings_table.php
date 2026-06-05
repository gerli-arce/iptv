<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('app_settings', 'key')) {
                $table->string('key')->nullable()->after('id');
            }

            if (! Schema::hasColumn('app_settings', 'value')) {
                $table->text('value')->nullable()->after('key');
            }

            if (! Schema::hasColumn('app_settings', 'type')) {
                $table->enum('type', ['string', 'boolean', 'integer', 'json'])
                    ->default('string')
                    ->after('value');
            }
        });

        if (
            Schema::hasColumn('app_settings', 'key')
            && ! Schema::hasIndex('app_settings', 'app_settings_key_unique', 'unique')
        ) {
            Schema::table('app_settings', function (Blueprint $table) {
                $table->unique('key', 'app_settings_key_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('app_settings', function (Blueprint $table) {
            if (Schema::hasColumn('app_settings', 'type')) {
                $table->dropColumn('type');
            }

            if (Schema::hasColumn('app_settings', 'value')) {
                $table->dropColumn('value');
            }

            if (Schema::hasColumn('app_settings', 'key')) {
                if (Schema::hasIndex('app_settings', 'app_settings_key_unique', 'unique')) {
                    $table->dropUnique('app_settings_key_unique');
                }
                $table->dropColumn('key');
            }
        });
    }
};
