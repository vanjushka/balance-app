<?php

namespace App\Controllers;

use App\Models\SymptomLog;
use Illuminate\Http\Request;

class SymptomStatsController
{
    /**
     * GET /api/symptoms/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
     * Gibt Aggregationen für Charts zurück:
     * - average_pain (Float)
     * - mood_distribution (Map)
     * - energy_distribution (Map)
     * - pain_trend: [{ date, pain }]
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'from' => ['sometimes','date'],
            'to'   => ['sometimes','date','after_or_equal:from'],
        ]);

        $q = SymptomLog::query()
            ->where('user_id', $user->id)
            ->select(['id','log_date','pain_intensity','energy_level','mood']);

        if (isset($data['from'])) {
            $q->where('log_date', '>=', $data['from']);
        }
        if (isset($data['to'])) {
            $q->where('log_date', '<=', $data['to']);
        }

        $rows = $q->orderBy('log_date')->get();

        // Aggregationen
        $avgPain = round((float) $rows->avg('pain_intensity'), 2);

        $moodDist = $rows->groupBy('mood')->map->count();
        $energyDist = $rows->groupBy('energy_level')->map->count();

        $trend = $rows->map(fn ($r) => [
            'date' => $r->log_date->toDateString(),
            'pain' => (int) $r->pain_intensity,
        ])->values();

        return response()->json([
            'average_pain'        => $avgPain,
            'mood_distribution'   => $moodDist,        // z.B. { "calm": 3, "stressed": 2, ... }
            'energy_distribution' => $energyDist,      // z.B. { "low": 1, "medium": 3, "high": 1 }
            'pain_trend'          => $trend,           // z.B. [ {date:"2025-10-20", pain:4}, ... ]
        ], 200);
    }
}
