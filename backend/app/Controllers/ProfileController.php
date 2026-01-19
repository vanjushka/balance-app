<?php

namespace App\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController
{
    public function summary(Request $request)
    {
        $user = $request->user();

        // distinct days tracked
        $daysTracked = (int) DB::table('symptom_logs')
            ->where('user_id', $user->id)
            ->distinct('log_date')
            ->count('log_date');

        // first log date if exists (else fallback to account created_at)
        $firstLog = DB::table('symptom_logs')
            ->where('user_id', $user->id)
            ->min('log_date');

        return response()->json([
            'data' => [
                'tracking_since' => $firstLog ?: optional($user->created_at)->toDateString(),
                'days_tracked' => $daysTracked,
                // We keep these intentionally null until you have real cycle logic / definition
                'cycles_recorded' => null,
                'patterns_discovered' => null,
            ],
        ]);
    }
}
