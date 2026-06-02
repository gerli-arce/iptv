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
            $table->string("action_type")->default("none");
            $table->json("action_payload")->nullable();
            $table->unsignedInteger("position")->default(0);
            $table->boolean("active")->default(true);
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
