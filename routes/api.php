<?php

use Illuminate\Support\Facades\Route;

use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\SymptomController;
use App\Controllers\SymptomStatsController;
use App\Controllers\PostController;
use App\Controllers\CommentsController;
use App\Controllers\ReportsController;

// guest endpoints
Route::get('/health', fn () => ['status' => 'ok', 'time' => now()->toISOString()]);

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/user', [UserController::class, 'create']);

// protected endpoints (auth sanctum)
Route::middleware(['auth:sanctum'])->group(function () {
    // auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // self-service user
    Route::get('/user', [UserController::class, 'index']);
    Route::patch('/user', [UserController::class, 'update']);
    Route::delete('/user', [UserController::class, 'destroy']);

    // symptoms
    Route::get('/symptoms', [SymptomController::class, 'index']);
    Route::post('/symptoms', [SymptomController::class, 'create']);
    Route::patch('/symptoms', [SymptomController::class, 'update']);
    Route::delete('/symptoms', [SymptomController::class, 'destroy']);
    Route::get('/symptoms/stats', [SymptomStatsController::class, 'index']);

    // community
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'create']);
    Route::patch('/posts', [PostController::class, 'update']);
    Route::delete('/posts', [PostController::class, 'destroy']);

    Route::get('/comments', [CommentsController::class, 'index']);
    Route::post('/comments', [CommentsController::class, 'create']);
    Route::patch('/comments', [CommentsController::class, 'update']);
    Route::delete('/comments', [CommentsController::class, 'destroy']);

    // likes
    Route::post('/posts/{id}/like', [PostController::class, 'like']);

    // reports
    Route::get('/reports', [ReportsController::class, 'index']);
    Route::post('/reports', [ReportsController::class, 'create']);
    Route::get('/reports/{id}/download', [ReportsController::class, 'download']);
    Route::delete('/reports', [ReportsController::class, 'destroy']);
});
