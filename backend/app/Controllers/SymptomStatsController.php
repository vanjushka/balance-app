<?php

namespace App\Controllers;

use App\Models\SymptomLog;
use Illuminate\Http\Request;

class SymptomStatsController
{
    /** GET /api/symptoms/stats?from=&to= */
    public function index(Request $request)
    {
        $u = $request->user();
        $data = $request->validate([
            'from' => ['sometimes','date'],
            'to'   => ['sometimes','date','after_or_equal:from'],
        ]);

        $q = SymptomLog::where('user_id', $u->id);
        if (!empty($data['from'])) $q->where('log_date','>=',$data['from']);
        if (!empty($data['to']))   $q->where('log_date','<=',$data['to']);

        $logs = $q->orderBy('log_date')->get(['log_date','pain_intensity','energy_level','mood']);

        $average_pain = round((float) $logs->avg('pain_intensity'), 2);

        $mood_distribution = $logs->groupBy('mood')->map->count();
        $energy_distribution = $logs->groupBy('energy_level')->map->count();

        $pain_trend = $logs->map(fn($l) => [
            'date' => $l->log_date->toDateString(),
            'pain' => (int) $l->pain_intensity,
        ])->values();

        return response()->json([
            'average_pain'        => $average_pain,
            'mood_distribution'   => $mood_distribution,
            'energy_distribution' => $energy_distribution,
            'pain_trend'          => $pain_trend,
            'count'               => $logs->count(),
        ], 200);
    }
}
