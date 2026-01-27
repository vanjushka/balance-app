<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        DB::table('symptom_logs')
            ->whereNull('energy_level')
            ->update(['energy_level' => 'moderate']);

        DB::table('symptom_logs')
            ->where('energy_level', 'medium')
            ->update(['energy_level' => 'moderate']);

        Schema::table('symptom_logs', function (Blueprint $table) {
            $table->enum('energy_level', [
                'depleted',
                'low',
                'moderate',
                'good',
                'energized',
            ])->default('moderate')->change();
        });
    }

    public function down(): void
    {
        DB::table('symptom_logs')
            ->whereIn('energy_level', ['depleted', 'low'])
            ->update(['energy_level' => 'low']);

        DB::table('symptom_logs')
            ->whereIn('energy_level', ['moderate'])
            ->update(['energy_level' => 'medium']);

        DB::table('symptom_logs')
            ->whereIn('energy_level', ['good', 'energized'])
            ->update(['energy_level' => 'high']);

        Schema::table('symptom_logs', function (Blueprint $table) {
            $table->enum('energy_level', [
                'low',
                'medium',
                'high',
            ])->default('medium')->change();
        });
    }
};
