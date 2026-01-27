<?php

namespace App\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileController
{
    public function summary(Request $request)
    {
        $user = $request->user();

        $daysTracked = (int) DB::table('symptom_logs')
            ->where('user_id', $user->id)
            ->distinct()
            ->count('log_date');

        $firstLog = DB::table('symptom_logs')
            ->where('user_id', $user->id)
            ->min('log_date');

        return response()->json([
            'data' => [
                'tracking_since' => $firstLog ?: optional($user->created_at)->toDateString(),
                'days_tracked' => $daysTracked,
                'cycles_recorded' => null,
                'patterns_discovered' => null,
            ],
        ]);
    }
}
