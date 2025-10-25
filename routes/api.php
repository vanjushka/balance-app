<?php

use Illuminate\Support\Facades\Route;

use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\SymptomController;
use App\Controllers\SymptomStatsController;
use App\Controllers\PostController;
use App\Controllers\CommentsController;
use App\Controllers\ReportsController;

// --- public ---
Route::get('/health', fn () => ['status' => 'ok', 'time' => now()->toISOString()]);
Route::get('/app/meta', fn () => [
    'moods' => ['calm','stressed','sad','happy'],
    'energy_levels' => ['low','medium','high'],
    'version' => 'v0.1'
]);

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/user', [UserController::class, 'create']); // register

// --- protected (sanctum) ---
Route::middleware(['auth:sanctum'])->group(function () {
    // auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // self-service user
    Route::get('/user', [UserController::class, 'index']);    // me
    Route::patch('/user', [UserController::class, 'update']); // me
    Route::delete('/user', [UserController::class, 'destroy']); // me (GDPR delete)

    // symptoms
    Route::get('/symptoms', [SymptomController::class, 'index']);
    Route::get('/symptoms/{id}', [SymptomController::class, 'show'])
        ->whereNumber('id');
    Route::post('/symptoms', [SymptomController::class, 'create']);
    Route::patch('/symptoms/{id}', [SymptomController::class, 'update'])
        ->whereNumber('id');
    Route::delete('/symptoms/{id}', [SymptomController::class, 'destroy'])
        ->whereNumber('id');
    Route::get('/symptoms/stats', [SymptomStatsController::class, 'index']);

    // posts
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{id}', [PostController::class, 'show'])->whereNumber('id');
    Route::post('/posts', [PostController::class, 'create']);
    Route::patch('/posts/{id}', [PostController::class, 'update'])->whereNumber('id');
    Route::delete('/posts/{id}', [PostController::class, 'destroy'])->whereNumber('id');
    Route::post('/posts/{id}/like', [PostController::class, 'like'])->whereNumber('id');

    // comments (nested list/create; delete by comment id)
    Route::get('/posts/{postId}/comments', [CommentsController::class, 'index'])->whereNumber('postId');
    Route::post('/posts/{postId}/comments', [CommentsController::class, 'create'])->whereNumber('postId');
    Route::patch('/comments/{id}', [CommentsController::class, 'update'])->whereNumber('id');
    Route::delete('/comments/{id}', [CommentsController::class, 'destroy'])->whereNumber('id');

    // reports
    Route::get('/reports', [ReportsController::class, 'index']);
    Route::get('/reports/{id}', [ReportsController::class, 'show'])->whereNumber('id');
    Route::post('/reports', [ReportsController::class, 'create']);
    Route::get('/reports/{id}/download', [ReportsController::class, 'download'])->whereNumber('id');
    Route::delete('/reports/{id}', [ReportsController::class, 'destroy'])->whereNumber('id');
});
