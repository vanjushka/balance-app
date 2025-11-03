<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['post_id','user_id','body'];

    public function post(){ return $this->belongsTo(\App\Models\Post::class); }
    public function user(){ return $this->belongsTo(\App\Models\User::class); }
}
