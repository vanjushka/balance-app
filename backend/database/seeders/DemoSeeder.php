<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

use App\Models\User;
use App\Models\SymptomLog;
use App\Models\Post;
use App\Models\Comment;
use App\Models\PostLike;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Demo User
        $user = User::create([
            'email'    => 'demo@balance.test',
            'password' => Hash::make('password'),
            'is_admin' => false,
            'profile'  => [
                'name'      => 'Demo User',
                'tz'        => 'Europe/Zurich',
                'diagnosis' => 'PCOS',
                'goal'      => 'Track symptoms & generate insights',
            ],
        ]);

        // Canonical values (MUSS mit DB + UI matchen)
        $moods = ['calm', 'stressed', 'sad', 'happy'];
        $energyLevels = ['depleted', 'low', 'moderate', 'good', 'energized'];

        $allowedTags = [
            'cramps','bloating','fatigue','headache','back_pain',
            'acne','hair_loss',
            'constipation','diarrhea',
            'anxious','irritable','brain_fog',
            'insomnia','restless_sleep',
            'heavy_flow','spotting',
        ];

        // 20 Tage Logs (für Insights + Shared Patterns)
        $start = Carbon::now()->subDays(19)->startOfDay();

        for ($i = 0; $i < 20; $i++) {
            $date = $start->copy()->addDays($i);

            SymptomLog::create([
                'user_id'        => $user->id,
                'log_date'       => $date->toDateString(),
                'pain_intensity' => rand(2, 8),
                'energy_level'   => $energyLevels[array_rand($energyLevels)],
                'mood'           => $moods[array_rand($moods)],
                'sleep_quality'  => rand(4, 9),
                'stress_level'   => rand(2, 8),
                'notes'          => 'Seeded demo log',
                'tags_json'      => collect($allowedTags)
                    ->random(rand(1, 3))
                    ->values()
                    ->all(),
            ]);
        }

        // Community demo content
        for ($p = 1; $p <= 3; $p++) {
            $post = Post::create([
                'user_id' => $user->id,
                'body'    => "Seeded post #$p — Balance demo",
            ]);

            for ($c = 1; $c <= 2; $c++) {
                Comment::create([
                    'post_id' => $post->id,
                    'user_id' => $user->id,
                    'body'    => "Seeded comment $c on post #$p",
                ]);
            }

            if (rand(0, 1)) {
                PostLike::firstOrCreate([
                    'post_id' => $post->id,
                    'user_id' => $user->id,
                ]);
            }
        }

        $this->command?->info('Demo data seeded successfully(demo@balance.test / password)');
    }
}
