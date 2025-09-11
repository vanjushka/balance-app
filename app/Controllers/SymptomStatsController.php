<?php

namespace App\Controllers;

use Illuminate\Http\Request;

class SymptomStatsController
{
    public function index(Request $request)
    {
        return response()->json([
            'by_day' => [],
            'weekly_avg' => [],
            'mood_distribution' => []
        ]);
    }
}
