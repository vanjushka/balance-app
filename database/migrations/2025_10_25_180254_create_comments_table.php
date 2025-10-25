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
        Schema::create('comments', function (Blueprint $t) {
    $t->id();
    $t->foreignId('post_id')->constrained()->onDelete('cascade');
    $t->foreignId('user_id')->constrained()->onDelete('cascade');
    $t->text('body');
    $t->timestamps();

    $t->index(['post_id', 'created_at']); // für schnelle Post-Kommentar-Listen
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
