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
        // Demo-User
        $user = User::create([
            'email'    => 'demo@balance.test',
            'password' => Hash::make('password'),
            'is_admin' => false,
            'profile'  => [
                'name'       => 'Demo User',
                'tz'         => 'Europe/Zurich',
                'diagnosis'  => 'PCOS',
                'goal'       => 'Track symptoms & create doctor snapshot',
            ],
        ]);

        // 14 Tage Symptom-Logs
        $start = Carbon::now()->subDays(13)->startOfDay();
        $moods   = ['calm','stressed','sad','happy'];
        $energy  = ['low','medium','high'];

        for ($i = 0; $i < 14; $i++) {
            $date = $start->copy()->addDays($i);

            SymptomLog::create([
                'user_id'        => $user->id,
                'log_date'       => $date->toDateString(),
                'pain_intensity' => rand(1, 10),
                'energy_level'   => $energy[array_rand($energy)],
                'mood'           => $moods[array_rand($moods)],
                'sleep_quality'  => rand(5, 9),
                'stress_level'   => rand(1, 10),
                'notes'          => 'Auto-seeded note '.$i,
                'tags_json'      => ['seeded','day-'.$i],
            ]);
        }

        // 3 Posts, je 2 Kommentare und 0-3 Likes (vom gleichen User möglich)
        for ($p = 1; $p <= 3; $p++) {
            $post = Post::create([
                'user_id'   => $user->id,
                'body'      => "Seeded post #$p — hello Balance!",
                'image_url' => null,
            ]);

            // comments
            for ($c = 1; $c <= 2; $c++) {
                Comment::create([
                    'post_id' => $post->id,
                    'user_id' => $user->id,
                    'body'    => "Seeded comment $c on post #$p",
                ]);
            }

            // likes (optional: 50% Chance, dass user liked)
            if (rand(0, 1)) {
                PostLike::firstOrCreate([
                    'post_id' => $post->id,
                    'user_id' => $user->id,
                ]);
            }
        }

        $this->command?->info('✅ Demo seeded: demo@balance.test / password');
    }
}
