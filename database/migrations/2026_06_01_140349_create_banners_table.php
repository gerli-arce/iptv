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
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string("title");
            $table->string("subtitle")->nullable();
            $table->string("image_url");
            $table->string("mobile_image_url")->nullable();
            $table->enum("content_type", ["live", "movie", "series", "url"])->default("url");
            $table->string("external_id")->nullable();
            $table->string("action_url")->nullable();
            $table->unsignedInteger("position")->default(0);
            $table->boolean("active")->default(true);
            $table->timestamp("starts_at")->nullable();
            $table->timestamp("ends_at")->nullable();
            $table->timestamps();

            $table->index(["active", "position"]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
