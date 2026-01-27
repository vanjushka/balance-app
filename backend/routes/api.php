<?php

use Illuminate\Support\Facades\Route;

use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\SymptomController;
use App\Controllers\SymptomStatsController;
use App\Controllers\ReportsController;
use App\Controllers\InsightsController;
use App\Controllers\CommunityPatternsController;
use App\Controllers\ProfileController;



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
    'energy_levels' => ['depleted', 'low', 'moderate', 'good', 'energized'],
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
    | Reports (legacy) + Insights (new)
    |----------------------------------------------------------------------
    */
    Route::get('/reports', [ReportsController::class, 'index']);
    Route::get('/reports/{id}', [ReportsController::class, 'show'])->whereNumber('id');
    Route::post('/reports', [ReportsController::class, 'create']);
    Route::get('/reports/{id}/download', [ReportsController::class, 'download'])->whereNumber('id');
    Route::delete('/reports/{id}', [ReportsController::class, 'destroy'])->whereNumber('id');

    Route::get('/insights', [InsightsController::class, 'show']);
    Route::post('/insights/summary', [InsightsController::class, 'summary']);
    Route::get('/community/patterns', [CommunityPatternsController::class, 'show'])
        ->middleware('throttle:10,1');
    Route::get('/profile/summary', [ProfileController::class, 'summary']);


});
