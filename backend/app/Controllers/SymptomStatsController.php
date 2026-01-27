<?php

namespace App\Controllers;

use App\Models\SymptomLog;
use Illuminate\Http\Request;

class SymptomStatsController
{
    public function index(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'from' => ['sometimes','date'],
            'to'   => ['sometimes','date','after_or_equal:from'],
        ]);

        $q = SymptomLog::query()->where('user_id', $user->id);

        if (!empty($data['from'])) $q->whereDate('log_date', '>=', $data['from']);
        if (!empty($data['to']))   $q->whereDate('log_date', '<=', $data['to']);

        $logs = $q->orderBy('log_date')->get([
            'log_date','pain_intensity','energy_level','mood'
        ]);

        $averagePain = $logs->whereNotNull('pain_intensity')->avg('pain_intensity');
        $averagePain = $averagePain !== null ? round((float) $averagePain, 2) : null;

        $moodDistribution = $logs
            ->pluck('mood')
            ->filter(fn ($v) => is_string($v) && trim($v) !== '')
            ->countBy()
            ->toArray();

        $energyDistribution = $logs
            ->pluck('energy_level')
            ->filter(fn ($v) => is_string($v) && trim($v) !== '')
            ->countBy()
            ->toArray();

        $painTrend = $logs->map(function ($l) {
            return [
                'date' => $l->log_date?->toDateString() ?? (string) $l->log_date,
                'pain' => $l->pain_intensity !== null ? (int) $l->pain_intensity : null,
            ];
        })->values();

        return response()->json([
            'average_pain'        => $averagePain,
            'mood_distribution'   => $moodDistribution,
            'energy_distribution' => $energyDistribution,
            'pain_trend'          => $painTrend,
            'count'               => $logs->count(),
        ], 200);
    }
}
