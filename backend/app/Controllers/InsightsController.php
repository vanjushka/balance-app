<?php

namespace App\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class InsightsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $range = (int) $request->query('range', 30);

        if (!in_array($range, [30, 90], true)) {
            return response()->json(
                ['message' => 'Invalid range. Allowed: 30, 90.'],
                422
            );
        }

        $userId = (int) $request->user()->id;

        $timezone = config('app.timezone') ?: 'UTC';
        $endDate = Carbon::now($timezone)->startOfDay();
        $startDate = (clone $endDate)->subDays($range - 1);

        $from = $startDate->toDateString();
        $to = $endDate->toDateString();

        // Pull minimal columns needed for aggregation (keep it cheap & stable)
        $rows = DB::table('symptom_logs')
            ->select([
                'log_date',
                'pain_intensity',
                'energy_level',
                'mood',
                'sleep_quality',
                'stress_level',
                'tags_json',
            ])
            ->where('user_id', $userId)
            ->whereBetween('log_date', [$from, $to])
            ->orderBy('log_date', 'asc')
            ->get();

        $loggedDays = $rows->count();

        $painValues = [];
        $stressValues = [];
        $sleepValues = [];

        $highPainDays = 0;   // pain >= 6
        $lowEnergyDays = 0;  // energy in depleted|low
        $highStressDays = 0; // stress >= 7

        $energyDist = [
            'depleted' => 0,
            'low' => 0,
            'moderate' => 0,
            'good' => 0,
            'energized' => 0,
        ];

        $moodDist = [
            'calm' => 0,
            'stressed' => 0,
            'sad' => 0,
            'happy' => 0,
        ];

        $tagCounts = []; // tag => count

        foreach ($rows as $r) {
            // pain
            if ($r->pain_intensity !== null && is_numeric($r->pain_intensity)) {
                $p = (int) $r->pain_intensity;
                $painValues[] = $p;
                if ($p >= 6) $highPainDays++;
            }

            // energy
            if (is_string($r->energy_level) && array_key_exists($r->energy_level, $energyDist)) {
                $energyDist[$r->energy_level]++;
                if ($r->energy_level === 'depleted' || $r->energy_level === 'low') {
                    $lowEnergyDays++;
                }
            }

            // mood
            if (is_string($r->mood) && array_key_exists($r->mood, $moodDist)) {
                $moodDist[$r->mood]++;
            }

            // stress
            if ($r->stress_level !== null && is_numeric($r->stress_level)) {
                $s = (int) $r->stress_level;
                $stressValues[] = $s;
                if ($s >= 7) $highStressDays++;
            }

            // sleep
            if ($r->sleep_quality !== null && is_numeric($r->sleep_quality)) {
                $sleepValues[] = (int) $r->sleep_quality;
            }

            // tags_json (stored as JSON, may come out as string from query builder)
            if ($r->tags_json !== null) {
                $tags = $r->tags_json;

                if (is_string($tags)) {
                    $decoded = json_decode($tags, true);
                    $tags = is_array($decoded) ? $decoded : [];
                }

                if (is_array($tags)) {
                    foreach ($tags as $t) {
                        if (!is_string($t)) continue;
                        $tag = trim(strtolower($t));
                        if ($tag === '') continue;
                        $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
                    }
                }
            }
        }

        // helpers
        $avg = function (array $vals): ?float {
            if (count($vals) === 0) return null;
            return round(array_sum($vals) / count($vals), 2);
        };

        $maxOrNull = function (array $vals): ?int {
            if (count($vals) === 0) return null;
            return max($vals);
        };

        arsort($tagCounts);
        $topTags = [];
        foreach ($tagCounts as $tag => $count) {
            $topTags[] = ['tag' => $tag, 'count' => $count];
            if (count($topTags) >= 8) break;
        }

        return response()->json([
            'data' => [
                'counts' => [
                    'logged_days' => $loggedDays,
                    'range_days' => $range,
                ],
                'pain' => [
                    'avg' => $avg($painValues),
                    'max' => $maxOrNull($painValues),
                    'high_days' => $highPainDays,
                ],
                'energy' => [
                    'low_days' => $lowEnergyDays,
                    'distribution' => $energyDist,
                ],
                'mood' => [
                    'distribution' => $moodDist,
                ],
                'stress' => [
                    'avg' => $avg($stressValues),
                    'high_days' => $highStressDays,
                ],
                'sleep' => [
                    'avg' => $avg($sleepValues),
                ],
                'tags' => [
                    'top' => $topTags,
                ],
            ],
            'meta' => [
                'range_days' => $range,
                'date_from' => $from,
                'date_to' => $to,
                'timezone' => $timezone,
                'generated_at' => Carbon::now($timezone)->toIso8601String(),
            ],
        ]);
    }
}
