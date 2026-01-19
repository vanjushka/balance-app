<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Faker\Factory as Faker;
use App\Models\User;
use App\Models\SymptomLog;

class SymptomLogSeeder extends Seeder
{
    /**
     * Must match frontend/lib/symptomTags.ts (canonical slugs)
     */
    private const TAGS = [
        // physical
        'cramps','bloating','fatigue','headache','back_pain','joint_pain','breast_tenderness','nausea','dizziness',
        // skin_hair
        'acne','oily_skin','dry_skin','hair_loss','excess_hair_growth',
        // digestive
        'constipation','diarrhea','gas','stomach_pain',
        // emotional
        'anxious','irritable','low_mood','brain_fog','mood_swings',
        // sleep_rest
        'insomnia','restless_sleep','night_sweats',
        // cycle_irregularities
        'heavy_flow','light_flow','spotting','missed_period','irregular_cycle','clotting',
    ];

    private const ENERGY_LEVELS = ['depleted', 'low', 'moderate', 'good', 'energized'];
    private const MOODS = ['calm', 'stressed', 'sad', 'happy'];

    public function run(): void
    {
        $faker = Faker::create();
        $faker->seed(20260119);

        $users = User::query()->orderBy('id')->take(20)->get();

        if ($users->isEmpty()) {
            $this->command?->warn('SymptomLogSeeder: No users found. Create users first, then re-run.');
            return;
        }

        $days = 90; // ensures both 30 & 90 ranges have data
        $end = Carbon::today();
        $start = $end->copy()->subDays($days - 1);

        $created = 0;

        foreach ($users as $user) {
            // user-specific baseline -> patterns feel personal
            $baseStress = $faker->numberBetween(3, 7);        // 0..10 later clamped
            $baseResilience = $faker->numberBetween(0, 2);    // reduces stress impact a bit
            $cycleLen = $faker->randomElement([26, 28, 30, 32]);
            $cycleOffset = $faker->numberBetween(0, $cycleLen - 1);

            // adherence: some users track more consistently than others
            $logProbability = $faker->randomElement([0.65, 0.72, 0.8, 0.85]);

            for ($i = 0; $i < $days; $i++) {
                $date = $start->copy()->addDays($i)->toDateString();

                // 1 entry per day max (you have unique(user_id, log_date))
                if ($faker->randomFloat() > $logProbability) {
                    continue;
                }

                $cycleDay = ($i + $cycleOffset) % $cycleLen; // 0..cycleLen-1
                $nearPeriod = ($cycleDay >= $cycleLen - 5 || $cycleDay <= 1); // pre + start
                $duringPeriod = ($cycleDay <= 2);

                // ---- Stress (0..10)
                $stress = $baseStress
                    + ($nearPeriod ? 1 : 0)
                    + $faker->numberBetween(-2, 2)
                    - $baseResilience;
                $stress = max(0, min(10, $stress));

                // ---- Pain (0..10)
                $pain = $faker->numberBetween(0, 4)
                    + ($nearPeriod ? $faker->numberBetween(1, 3) : 0)
                    + ($stress >= 7 ? $faker->numberBetween(0, 2) : 0);
                $pain = max(0, min(10, $pain));

                // ---- Sleep quality (1..10)
                $sleep = 7
                    + $faker->numberBetween(-2, 2)
                    - (int) floor($stress / 4)
                    - (int) floor($pain / 5);
                $sleep = max(1, min(10, $sleep));

                // ---- Energy level (5-level)
                $energy = $this->energyFromSignals($pain, $sleep, $stress, $faker);

                // ---- Mood (4-level)
                $mood = $this->moodFromSignals($stress, $pain, $sleep, $energy, $faker);

                // ---- Tags (0..5), clustered
                $tags = $this->generateTags($faker, $nearPeriod, $duringPeriod, $stress, $pain, $sleep, $mood);

                // ---- Notes (rare)
                $notes = null;
                if ($faker->randomFloat() < 0.16) {
                    $notes = $faker->sentence($faker->numberBetween(6, 12));
                }

                // Upsert-safe for reruns
                SymptomLog::query()->updateOrCreate(
                    ['user_id' => $user->id, 'log_date' => $date],
                    [
                        'pain_intensity' => $pain,
                        'energy_level' => $energy,
                        'mood' => $mood,
                        'sleep_quality' => $sleep,
                        'stress_level' => $stress,
                        'notes' => $notes,
                        'tags_json' => $tags ?: null,
                    ]
                );

                $created++;
            }
        }

        $this->command?->info("SymptomLogSeeder: created/updated {$created} symptom logs for {$users->count()} users.");
    }

    private function energyFromSignals(int $pain, int $sleep, int $stress, $faker): string
    {
        // score roughly -2..+10
        $score = 7
            + $faker->numberBetween(-2, 2)
            - (int) floor($pain / 3)
            - (int) floor((10 - $sleep) / 3)
            - (int) floor($stress / 5);

        if ($score <= 2) return 'depleted';
        if ($score <= 4) return 'low';
        if ($score <= 6) return 'moderate';
        if ($score <= 8) return 'good';
        return 'energized';
    }

    private function moodFromSignals(int $stress, int $pain, int $sleep, string $energy, $faker): string
    {
        if ($stress >= 8) return 'stressed';
        if ($pain >= 8 && $sleep <= 4) return 'sad';

        if ($energy === 'energized' && $stress <= 4 && $pain <= 3) {
            return $faker->randomElement(['happy', 'calm']);
        }

        if ($sleep >= 8 && $stress <= 5 && $pain <= 4) {
            return $faker->randomElement(['calm', 'happy']);
        }

        // otherwise mix
        return $faker->randomElement(self::MOODS);
    }

    private function generateTags($faker, bool $nearPeriod, bool $duringPeriod, int $stress, int $pain, int $sleep, string $mood): array
    {
        $tags = [];

        // Cycle-related cluster
        if ($nearPeriod) {
            if ($faker->randomFloat() < 0.70) $tags[] = 'cramps';
            if ($faker->randomFloat() < 0.60) $tags[] = 'bloating';
            if ($faker->randomFloat() < 0.35) $tags[] = 'breast_tenderness';
            if ($faker->randomFloat() < 0.25) $tags[] = 'mood_swings';
        }

        if ($duringPeriod) {
            if ($faker->randomFloat() < 0.25) $tags[] = 'spotting';
            if ($faker->randomFloat() < 0.20) $tags[] = 'heavy_flow';
            if ($faker->randomFloat() < 0.10) $tags[] = 'clotting';
        }

        // Pain cluster
        if ($pain >= 6) {
            if ($faker->randomFloat() < 0.45) $tags[] = 'headache';
            if ($faker->randomFloat() < 0.40) $tags[] = 'back_pain';
            if ($faker->randomFloat() < 0.18) $tags[] = 'joint_pain';
            if ($faker->randomFloat() < 0.25) $tags[] = 'nausea';
            if ($faker->randomFloat() < 0.15) $tags[] = 'dizziness';
        }

        // Digestive
        if ($faker->randomFloat() < 0.18) $tags[] = 'gas';
        if ($faker->randomFloat() < 0.12) $tags[] = 'stomach_pain';
        if ($nearPeriod && $faker->randomFloat() < 0.20) $tags[] = 'constipation';
        if ($faker->randomFloat() < 0.08) $tags[] = 'diarrhea';

        // Sleep/rest
        if ($sleep <= 4) {
            if ($faker->randomFloat() < 0.60) $tags[] = 'insomnia';
            if ($faker->randomFloat() < 0.40) $tags[] = 'restless_sleep';
            if ($faker->randomFloat() < 0.20) $tags[] = 'night_sweats';
        }

        // Emotional
        if ($stress >= 7 || $mood === 'stressed') {
            if ($faker->randomFloat() < 0.50) $tags[] = 'anxious';
            if ($faker->randomFloat() < 0.38) $tags[] = 'irritable';
            if ($faker->randomFloat() < 0.25) $tags[] = 'brain_fog';
        }
        if ($mood === 'sad' && $faker->randomFloat() < 0.40) $tags[] = 'low_mood';
        if ($nearPeriod && $faker->randomFloat() < 0.12) $tags[] = 'mood_swings';

        // Skin/hair (low freq, recurring)
        if ($faker->randomFloat() < 0.10) $tags[] = 'acne';
        if ($faker->randomFloat() < 0.08) $tags[] = 'oily_skin';
        if ($faker->randomFloat() < 0.05) $tags[] = 'dry_skin';
        if ($faker->randomFloat() < 0.03) $tags[] = 'hair_loss';
        if ($faker->randomFloat() < 0.02) $tags[] = 'excess_hair_growth';

        // Fatigue: common
        if ($faker->randomFloat() < 0.28 || $pain >= 6 || $sleep <= 4) {
            $tags[] = 'fatigue';
        }

        // Cap
        $tags = array_values(array_unique($tags));
        if (count($tags) > 5) {
            shuffle($tags);
            $tags = array_slice($tags, 0, 5);
        }

        // Ensure all tags are canonical (defensive)
        $tags = array_values(array_filter($tags, fn($t) => in_array($t, self::TAGS, true)));

        return $tags;
    }
}
