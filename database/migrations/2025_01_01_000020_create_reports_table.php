<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->date('period_start');
            $table->date('period_end');
            $table->string('file_path', 255);
            $table->timestamp('generated_at')->useCurrent();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index(['user_id','generated_at']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('reports');
    }
};
