<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['email','password','profile','is_admin'];

    protected $hidden = ['password','remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'profile' => 'array',
        'is_admin' => 'boolean',
    ];


    /** Hash password on set; keep if already hashed */
    public function setPasswordAttribute($value): void
    {
        if (!$value) return;

        $this->attributes['password'] =
            (is_string($value) && str_starts_with($value, '$2y$'))
                ? $value
                : Hash::make($value);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }
}
