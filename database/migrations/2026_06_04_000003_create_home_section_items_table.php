<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('home_section_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('home_sections')->cascadeOnDelete();
            $table->enum('content_type', ['live', 'movie', 'series']);
            $table->string('external_id');
            $table->string('custom_title')->nullable();
            $table->string('custom_image')->nullable();
            $table->string('badge')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->index(['section_id', 'active', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('home_section_items');
    }
};
