<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('section_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId("section_id")->constrained()->cascadeOnDelete();
            $table->enum("content_type", ["movie", "series", "live"]);
            $table->string("external_id", 80);
            $table->unsignedInteger("position")->default(0);
            $table->boolean("active")->default(true);
            $table->timestamps();

            $table->index(["section_id", "active", "position"]);
            $table->unique(
                ["section_id", "content_type", "external_id"],
                "uniq_section_content_ref"
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('section_items');
    }
};
