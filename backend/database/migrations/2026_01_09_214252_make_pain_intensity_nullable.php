<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('symptom_logs', function (Blueprint $table) {
            $table->unsignedTinyInteger('pain_intensity')
                  ->nullable()
                  ->change();
        });
    }

    public function down(): void
    {
        Schema::table('symptom_logs', function (Blueprint $table) {
            $table->unsignedTinyInteger('pain_intensity')
                  ->nullable(false)
                  ->change();
        });
    }
};
