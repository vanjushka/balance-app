<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SymptomLog extends Model
{
    use HasFactory;

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
        'log_date'       => 'date',
        'tags_json'      => 'array',
        'pain_intensity' => 'integer',
        'sleep_quality'  => 'integer',
        'stress_level'   => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
