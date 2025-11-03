<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('symptom_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->date('log_date');
    $table->tinyInteger('pain_intensity')->unsigned();
    $table->enum('energy_level', ['low', 'medium', 'high']);
    $table->enum('mood', ['calm', 'stressed', 'sad', 'happy']);
    $table->tinyInteger('sleep_quality')->nullable()->unsigned();
    $table->tinyInteger('stress_level')->nullable()->unsigned();
    $table->text('notes')->nullable();
    $table->json('tags_json')->nullable();
    $table->timestamps();

    $table->unique(['user_id', 'log_date']);
});

    }
              public function down(): void {
            Schema::dropIfExists('symptom_logs');
    }
};
