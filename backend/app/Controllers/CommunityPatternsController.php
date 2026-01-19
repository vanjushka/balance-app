<?php

namespace App\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CommunityPatternsController
{
    public function show(Request $request)
    {
        $v = Validator::make($request->all(), [
            'range' => ['required', 'in:30,90'],
        ]);

        if ($v->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $v->errors(),
            ], 422);
        }

        $rangeDays = (int) $request->query('range');
        $tz = 'UTC';

        // We keep dates aligned with how your frontend computes ranges (UTC date-only)
        $dateTo = now('UTC')->toDateString();
        $dateFrom = now('UTC')->subDays($rangeDays - 1)->toDateString();

        // NOTE: This endpoint is "community" but we keep it safe:
        // - aggregate across ALL users except current user
        // - no raw logs returned, only aggregated patterns
        $currentUserId = Auth::id();

        // Simple anonymized aggregations from symptom_logs
        // Assumptions:
        // - symptom_logs has: user_id, log_date (date), pain_intensity (int|null), energy_level (string|null), tags_json (json|null)
        // - stress_level might exist; we won't depend on it
        $totalLogs = (int) DB::table('symptom_logs')
            ->whereBetween('log_date', [$dateFrom, $dateTo])
            ->where('user_id', '!=', $currentUserId)
            ->count();

        // If seed data is small, keep deterministic fallback
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
                    'timezone' => $tz,
                    'generated_at' => now('UTC')->toISOString(),
                    'cached' => false,
                    'cohort_size' => null,
                ],
            ]);
        }

        // Pattern 1: % of logs with high pain (>=6)
        $highPain = (int) DB::table('symptom_logs')
            ->whereBetween('log_date', [$dateFrom, $dateTo])
            ->where('user_id', '!=', $currentUserId)
            ->whereNotNull('pain_intensity')
            ->where('pain_intensity', '>=', 6)
            ->count();

        $highPainPct = $totalLogs > 0 ? round(($highPain / $totalLogs) * 100) : 0;

        // Pattern 2: % of logs that are low energy (depleted/low)
        $lowEnergy = (int) DB::table('symptom_logs')
            ->whereBetween('log_date', [$dateFrom, $dateTo])
            ->where('user_id', '!=', $currentUserId)
            ->whereIn('energy_level', ['depleted', 'low'])
            ->count();

        $lowEnergyPct = $totalLogs > 0 ? round(($lowEnergy / $totalLogs) * 100) : 0;

        // Pattern 3: top tag (requires MySQL JSON extraction; fallback if not supported)
        $topTag = null;
        try {
            // This assumes tags_json is a JSON array of strings.
            // MySQL 8: JSON_TABLE exists, but not always enabled. We'll do a safer fallback.
            // Fallback: just count rows containing substring '"bloating"' etc is not great.
            // We keep it simple: pick from known tags if present in seeded data.
            $known = ['bloating', 'acne', 'cramps', 'headache', 'nausea', 'insomnia'];
            $counts = [];

            foreach ($known as $tag) {
                $counts[$tag] = (int) DB::table('symptom_logs')
                    ->whereBetween('log_date', [$dateFrom, $dateTo])
                    ->where('user_id', '!=', $currentUserId)
                    ->whereJsonContains('tags_json', $tag)
                    ->count();
            }

            arsort($counts);
            $topTag = array_key_first($counts);
            if ($topTag && ($counts[$topTag] ?? 0) === 0) {
                $topTag = null;
            }
        } catch (\Throwable $e) {
            $topTag = null;
        }

        $patterns = [
            "In this period, about {$highPainPct}% of check-ins include higher pain levels (6+).",
            "Low energy is common: around {$lowEnergyPct}% of check-ins report low or depleted energy.",
            $topTag
                ? "A frequently logged symptom tag is “{$topTag}”, often appearing across multiple check-ins."
                : "Symptom tags often cluster over several days, especially when multiple symptoms overlap.",
        ];

        return response()->json([
            'data' => [
                'patterns' => $patterns,
                'disclaimer' => 'Community patterns are anonymized and generalized. They do not provide medical advice.',
            ],
            'meta' => [
                'range_days' => $rangeDays,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'timezone' => $tz,
                'generated_at' => now('UTC')->toISOString(),
                'cached' => false,
                'cohort_size' => null,
            ],
        ]);
    }
}
