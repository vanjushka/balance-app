<?php

namespace App\Models;


use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{

    use HasApiTokens, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password',
        'is_admin',
        'profile',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        // later switch to 'encrypted:array' for GDPR-friendly encryption
        'profile' => 'array',
        'is_admin' => 'boolean',
        'email_verified_at' => 'datetime',
    ];


    /** Hash on set ( both plain & already hashed) */
    public function setPasswordAttribute($value): void
    {
        if (!$value) return;
            // if it's already argon/ bcript
        if (is_string($value) && str_starts_with($value, '$')) {
            $this->attributes['password'] = $value;
        } else {
            $this->attributes['password'] = bcrypt($value);
        }
    }
}
