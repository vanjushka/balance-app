<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('symptom_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->date('log_date');
            $table->unsignedTinyInteger('pain_intensity'); //to be validated in controller
            $table->enum('energy_level', ['low', 'medium', 'high']);
            $table->enum('mood', ['calm', 'ok', 'sad', 'stressed', 'irritable', 'anxious', 'happy']);
            $table->unsignedTinyInteger('sleep_quality')->nullable();
            $table->unsignedTinyInteger('stress_level')->nullable();
            $table->text('notes')->nullable();
            $table->json('tags_json')->nullable();


            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index(['user_id', 'log_date']);
            // $table->unique(['user_id','log_date']); // max 1 log per day/user?

        });
    }
              public function down(): void {
            Schema::dropIfExists('symptom_logs');
    }
};
