<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['email', 'password', 'profile', 'is_admin'];

    protected $hidden = ['password'];

    protected $casts = [
        'profile' => 'array',
        'is_admin' => 'boolean',
    ];

    public function setPasswordAttribute($value): void
    {
        if (!$value) return;

        $this->attributes['password'] = Hash::needsRehash($value)
            ? Hash::make($value)
            : $value;
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }
}
