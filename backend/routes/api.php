<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
    'version' => 'v0.1',
]);

// EINE Login-Variante verwenden: entweder diese simple ODER den AuthController.
// ↓ Wenn du AuthController nutzt, kommentiere diesen Block aus.
Route::post('/login', function (Request $request) {
    $data = $request->validate([
        'email'    => ['required','email'],
        'password' => ['required','string'],
    ]);
    $user = \App\Models\User::where('email', $data['email'])->first();
    if (! $user || ! Hash::check($data['password'], $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 422);
    }
    $token = $user->createToken('bruno', ['*'])->plainTextToken;
    return response()->json(['token' => $token]);
})->middleware('throttle:5,1');

// AuthController Login (falls du den nutzt, in Bruno dann /auth/login verwenden)
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Register
Route::post('/user', [UserController::class, 'create']);

// --- protected (Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    // auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // self user
    Route::get('/user', [UserController::class, 'index']);
    Route::patch('/user', [UserController::class, 'update']);
    Route::delete('/user', [UserController::class, 'destroy']);

    // symptoms
    Route::get('/symptoms', [SymptomController::class, 'index']);
    Route::get('/symptoms/stats', [SymptomStatsController::class, 'index']);
    Route::get('/symptoms/{id}', [SymptomController::class, 'show'])->whereNumber('id');
    Route::post('/symptoms', [SymptomController::class, 'create']); // ← create, nicht store
    Route::patch('/symptoms/{id}', [SymptomController::class, 'update'])->whereNumber('id');
    Route::delete('/symptoms/{id}', [SymptomController::class, 'destroy'])->whereNumber('id');

    // posts
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{id}', [PostController::class, 'show'])->whereNumber('id');
    Route::post('/posts', [PostController::class, 'create']); // ← create
    Route::patch('/posts/{id}', [PostController::class, 'update'])->whereNumber('id');
    Route::delete('/posts/{id}', [PostController::class, 'destroy'])->whereNumber('id');
    Route::post('/posts/{id}/like', [PostController::class, 'like'])->whereNumber('id');

    // comments (nested unter posts)
    Route::get('/posts/{postId}/comments', [CommentsController::class, 'index'])->whereNumber('postId');
    Route::post('/posts/{postId}/comments', [CommentsController::class, 'create'])->whereNumber('postId'); // ← create
    Route::patch('/comments/{id}', [CommentsController::class, 'update'])->whereNumber('id');
    Route::delete('/comments/{id}', [CommentsController::class, 'destroy'])->whereNumber('id');

    // reports
    Route::get('/reports', [ReportsController::class, 'index']);
    Route::get('/reports/{id}', [ReportsController::class, 'show'])->whereNumber('id');
    Route::post('/reports', [ReportsController::class, 'create']); // ← create
    Route::get('/reports/{id}/download', [ReportsController::class, 'download'])->whereNumber('id');
    Route::delete('/reports/{id}', [ReportsController::class, 'destroy'])->whereNumber('id');
});
