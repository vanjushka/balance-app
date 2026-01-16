<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InsightsSummary extends Model
{
    protected $fillable = [
        'user_id',
        'range_days',
        'date_from',
        'date_to',
        'payload',
        'generated_at',
    ];

    protected $casts = [
        'date_from' => 'date:Y-m-d',
        'date_to' => 'date:Y-m-d',
        'generated_at' => 'datetime',
        'payload' => 'array',
    ];
}
