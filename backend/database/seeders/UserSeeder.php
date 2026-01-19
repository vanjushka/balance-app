<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Deterministic fake data
        $faker = Faker::create();
        $faker->seed(202401);

        // Avoid duplicate seeding
        $existing = User::count();
        $toCreate = max(0, 20 - $existing);

        if ($toCreate === 0) {
            $this->command?->info('UserSeeder: enough users already exist, skipping.');
            return;
        }

        for ($i = 0; $i < $toCreate; $i++) {
            User::create([
                'name' => $faker->name(),
                'email' => $faker->unique()->safeEmail(),
                // Password is irrelevant for seeding/demo purposes
                'password' => Hash::make('password'),
            ]);
        }

        $this->command?->info("UserSeeder: created {$toCreate} users.");
    }
}
