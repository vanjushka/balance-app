<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('insights_summaries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('range_days'); // 30 | 90

            $table->date('date_from');
            $table->date('date_to');

            $table->json('payload');

            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['user_id', 'range_days', 'date_from', 'date_to'],
                'insights_summary_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insights_summaries');
    }
};
