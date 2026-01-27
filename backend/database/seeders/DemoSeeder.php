<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

use App\Models\User;
use App\Models\SymptomLog;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'demo@balance.test'],
            [
                'password' => 'password',
                'is_admin' => false,
                'profile'  => [
                    'name'      => 'Demo User',
                    'tz'        => 'Europe/Zurich',
                    'diagnosis' => 'PCOS',
                    'goal'      => 'Track symptoms & generate insights',
                ],
            ]
        );

        $moods = ['calm', 'stressed', 'sad', 'happy'];
        $energyLevels = ['depleted', 'low', 'moderate', 'good', 'energized'];

        $allowedTags = [
            'cramps','bloating','fatigue','headache','back_pain','joint_pain','breast_tenderness','nausea','dizziness',
            'acne','oily_skin','dry_skin','hair_loss','excess_hair_growth',
            'constipation','diarrhea','gas','stomach_pain',
            'anxious','irritable','low_mood','brain_fog','mood_swings',
            'insomnia','restless_sleep','night_sweats',
            'heavy_flow','light_flow','spotting','missed_period','irregular_cycle','clotting',
        ];

        $start = Carbon::now('UTC')->subDays(19)->startOfDay();

        for ($i = 0; $i < 20; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();

            $tags = collect($allowedTags)
                ->shuffle()
                ->take(random_int(1, 3))
                ->values()
                ->all();

            SymptomLog::query()->updateOrCreate(
                ['user_id' => $user->id, 'log_date' => $date],
                [
                    'pain_intensity' => random_int(2, 8),
                    'energy_level'   => $energyLevels[array_rand($energyLevels)],
                    'mood'           => $moods[array_rand($moods)],
                    'sleep_quality'  => random_int(4, 9),
                    'stress_level'   => random_int(2, 8),
                    'notes'          => null,
                    'tags_json'      => $tags,
                ]
            );
        }

        $this->command?->info('Demo seeded: demo@balance.test / password');
    }
}
