<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SymptomLog extends Model
{
    protected $fillable = [
        'user_id',
        'log_date',
        'pain_intensity',
        'energy_level',
        'mood',
        'sleep_quality',
        'stress_level',
        'notes',
        'tags_json',
    ];

    protected $casts = [
        'log_date'       => 'date:Y-m-d',
        'pain_intensity' => 'integer',
        'sleep_quality'  => 'integer',
        'stress_level'   => 'integer',
        'tags_json'      => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
