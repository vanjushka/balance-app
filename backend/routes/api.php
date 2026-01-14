<?php

use Illuminate\Support\Facades\Route;

use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\SymptomController;
use App\Controllers\SymptomStatsController;
use App\Controllers\PostController;
use App\Controllers\CommentsController;
use App\Controllers\ReportsController;
use App\Controllers\InsightsController;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

Route::get('/health', fn () => [
    'status' => 'ok',
    'time' => now()->toISOString(),
]);

Route::get('/app/meta', fn () => [
    'moods' => ['calm', 'stressed', 'sad', 'happy'],
    'energy_levels' => ['low', 'medium', 'high'],
    'version' => 'v0.1',
]);

/*
|--------------------------------------------------------------------------
| Auth (Sanctum SPA / Session-based)
|--------------------------------------------------------------------------
|
| Uses web middleware to enable sessions & cookies.
|
*/

Route::prefix('auth')
    ->middleware('web')
    ->group(function () {
        Route::post('login', [AuthController::class, 'login'])
            ->middleware('throttle:5,1');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

/*
|--------------------------------------------------------------------------
| User registration (public)
|--------------------------------------------------------------------------
*/

Route::post('/user', [UserController::class, 'create']);

/*
|--------------------------------------------------------------------------
| Protected (Sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    /*
    |----------------------------------------------------------------------
    | User
    |----------------------------------------------------------------------
    */
    Route::get('/user', [UserController::class, 'index']);
    Route::patch('/user', [UserController::class, 'update']);
    Route::delete('/user', [UserController::class, 'destroy']);

    /*
    |----------------------------------------------------------------------
    | Symptoms
    |----------------------------------------------------------------------
    */
    Route::get('/symptoms', [SymptomController::class, 'index']);
    Route::get('/symptoms/stats', [SymptomStatsController::class, 'index']);
    Route::get('/symptoms/{id}', [SymptomController::class, 'show'])->whereNumber('id');
    Route::post('/symptoms', [SymptomController::class, 'create']);
    Route::patch('/symptoms/{id}', [SymptomController::class, 'update'])->whereNumber('id');
    Route::delete('/symptoms/{id}', [SymptomController::class, 'destroy'])->whereNumber('id');

    /*
    |----------------------------------------------------------------------
    | Posts + Comments
    |----------------------------------------------------------------------
    */
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{id}', [PostController::class, 'show'])->whereNumber('id');
    Route::post('/posts', [PostController::class, 'create']);
    Route::patch('/posts/{id}', [PostController::class, 'update'])->whereNumber('id');
    Route::delete('/posts/{id}', [PostController::class, 'destroy'])->whereNumber('id');
    Route::post('/posts/{id}/like', [PostController::class, 'like'])->whereNumber('id');

    Route::get('/posts/{postId}/comments', [CommentsController::class, 'index'])->whereNumber('postId');
    Route::post('/posts/{postId}/comments', [CommentsController::class, 'create'])->whereNumber('postId');
    Route::patch('/comments/{id}', [CommentsController::class, 'update'])->whereNumber('id');
    Route::delete('/comments/{id}', [CommentsController::class, 'destroy'])->whereNumber('id');

    /*
    |----------------------------------------------------------------------
    | Reports (legacy) + Insights (new)
    |----------------------------------------------------------------------
    */
    Route::get('/reports', [ReportsController::class, 'index']);
    Route::get('/reports/{id}', [ReportsController::class, 'show'])->whereNumber('id');
    Route::post('/reports', [ReportsController::class, 'create']);
    Route::get('/reports/{id}/download', [ReportsController::class, 'download'])->whereNumber('id');
    Route::delete('/reports/{id}', [ReportsController::class, 'destroy'])->whereNumber('id');

    Route::get('/insights', [InsightsController::class, 'show']);
});
