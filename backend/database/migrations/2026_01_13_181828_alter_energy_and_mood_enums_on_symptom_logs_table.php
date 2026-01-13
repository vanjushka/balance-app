<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
public function up(): void
{
    DB::statement("
        ALTER TABLE symptom_logs
        MODIFY energy_level ENUM('low','medium','high','moderate','energized') NOT NULL
    ");

    DB::statement("UPDATE symptom_logs SET energy_level = 'moderate' WHERE energy_level = 'medium'");
    DB::statement("UPDATE symptom_logs SET energy_level = 'energized' WHERE energy_level = 'high'");

    DB::statement("
        ALTER TABLE symptom_logs
        MODIFY energy_level ENUM('depleted','low','moderate','good','energized') NULL
    ");

    DB::statement("
        ALTER TABLE symptom_logs
        MODIFY mood ENUM('calm','stressed','sad','happy') NULL
    ");
}


    public function down(): void
    {
        DB::statement("
            ALTER TABLE symptom_logs
            MODIFY energy_level ENUM('low','medium','high') NOT NULL
        ");

        DB::statement("
            ALTER TABLE symptom_logs
            MODIFY mood ENUM('calm','stressed','sad','happy') NOT NULL
        ");
    }
};
