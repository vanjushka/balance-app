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
        Schema::create('post_likes', function (Blueprint $t) {
    $t->id();
    $t->foreignId('post_id')->constrained()->onDelete('cascade');
    $t->foreignId('user_id')->constrained()->onDelete('cascade');
    $t->timestamps();
    $t->unique(['post_id','user_id']); // 1 Like pro User & Post
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_likes');
    }
};
