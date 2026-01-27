<?php

namespace App\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CommunityPatternsController
{
    public function show(Request $request)
    {
        $v = Validator::make($request->query(), [
            'range' => ['required', 'in:30,90'],
        ]);

        if ($v->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $v->errors(),
            ], 422);
        }

        $rangeDays = (int) $request->query('range');
        $now = now('UTC');

        $dateTo = $now->toDateString();
        $dateFrom = $now->copy()->subDays($rangeDays - 1)->toDateString();

        $currentUserId = Auth::id();

        $base = DB::table('symptom_logs')
            ->whereBetween('log_date', [$dateFrom, $dateTo])
            ->where('user_id', '!=', $currentUserId);

        $totalLogs = (int) (clone $base)->count();

        if ($totalLogs < 25) {
            return response()->json([
                'data' => [
                    'patterns' => [
                        'Many users notice symptom intensity increases in the days leading up to their period.',
                        'Fatigue and low energy are commonly logged on the same days as cramps or bloating.',
                        'Mood shifts are frequently reported during weeks with recurring symptom flare-ups.',
                    ],
                    'disclaimer' => 'Community patterns are anonymized and generalized. They do not provide medical advice.',
                ],
                'meta' => [
                    'range_days' => $rangeDays,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'timezone' => 'UTC',
                    'generated_at' => $now->toISOString(),
                    'cached' => false,
                    'logs_count' => $totalLogs,
                ],
            ]);
        }

        $highPain = (int) (clone $base)
            ->whereNotNull('pain_intensity')
            ->where('pain_intensity', '>=', 6)
            ->count();

        $highPainPct = $totalLogs > 0 ? (int) round(($highPain / $totalLogs) * 100) : 0;

        $lowEnergy = (int) (clone $base)
            ->whereIn('energy_level', ['depleted', 'low'])
            ->count();

        $lowEnergyPct = $totalLogs > 0 ? (int) round(($lowEnergy / $totalLogs) * 100) : 0;

        $topTag = null;

        try {
            $known = ['bloating', 'acne', 'cramps', 'headache', 'nausea', 'insomnia', 'brain_fog', 'mood_swings'];
            $counts = [];

            foreach ($known as $tag) {
                $counts[$tag] = (int) (clone $base)
                    ->whereJsonContains('tags_json', $tag)
                    ->count();
            }

            arsort($counts);

            $candidate = array_key_first($counts);

            if ($candidate && ($counts[$candidate] ?? 0) > 0) {
                $topTag = $candidate;
            }
        } catch (\Throwable $e) {
            $topTag = null;
        }

        $patterns = [
            "In this period, about {$highPainPct}% of check-ins include higher pain levels (6+).",
            "Low energy is common: around {$lowEnergyPct}% of check-ins report low or depleted energy.",
            $topTag
                ? "A frequently logged symptom tag is “{$topTag}”, appearing across many check-ins."
                : 'Symptom tags often cluster over several days, especially when multiple symptoms overlap.',
        ];

        return response()->json([
            'data' => [
                'patterns' => array_slice($patterns, 0, 3),
                'disclaimer' => 'Community patterns are anonymized and generalized. They do not provide medical advice.',
            ],
            'meta' => [
                'range_days' => $rangeDays,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'timezone' => 'UTC',
                'generated_at' => $now->toISOString(),
                'cached' => false,
                'logs_count' => $totalLogs,
            ],
        ]);
    }
}
