<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Post extends Model
{
    use HasFactory;

    protected $fillable = ['user_id','body','image_url'];

    public function user(){ return $this->belongsTo(User::class); }
    public function likes(){ return $this->hasMany(PostLike::class); }
    public function comments(){ return $this->hasMany(Comment::class); } // falls du Comments später nutzt
}
