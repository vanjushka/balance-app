<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('email', 190)->unique();
        $table->string('password', 255);
        $table->boolean('is_admin')->default(false);
        $table->json('profile')->nullable();

        $table->timestamp('created_at')->nullable();
        $table->timestamp('updated_at')->nullable();
    });
    }

    public function down(): void {
        Schema::dropIfExists('users');
    }
};
