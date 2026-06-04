<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            if (! Schema::hasColumn('banners', 'content_type')) {
                $table->enum('content_type', ['live', 'movie', 'series', 'url'])
                    ->default('url')
                    ->after('mobile_image_url');
            }

            if (! Schema::hasColumn('banners', 'external_id')) {
                $table->string('external_id')->nullable()->after('content_type');
            }

            if (! Schema::hasColumn('banners', 'action_url')) {
                $table->string('action_url')->nullable()->after('external_id');
            }

            if (! Schema::hasColumn('banners', 'starts_at')) {
                $table->timestamp('starts_at')->nullable()->after('active');
            }

            if (! Schema::hasColumn('banners', 'ends_at')) {
                $table->timestamp('ends_at')->nullable()->after('starts_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            if (Schema::hasColumn('banners', 'ends_at')) {
                $table->dropColumn('ends_at');
            }

            if (Schema::hasColumn('banners', 'starts_at')) {
                $table->dropColumn('starts_at');
            }

            if (Schema::hasColumn('banners', 'action_url')) {
                $table->dropColumn('action_url');
            }

            if (Schema::hasColumn('banners', 'external_id')) {
                $table->dropColumn('external_id');
            }

            if (Schema::hasColumn('banners', 'content_type')) {
                $table->dropColumn('content_type');
            }
        });
    }
};
