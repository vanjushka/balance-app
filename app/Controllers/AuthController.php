<?php

namespace App\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController
{
    /** POST /api/auth/login */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email|max:190',
            'password' => 'required|string|max:64',
        ]);

        $email = strtolower(trim($data['email']));
        $user  = User::where('email', $email)->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user'  => $user->fresh(),
            'token' => $token,
        ], 200);
    }

    /** POST /api/auth/logout  (requires Bearer token) */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'ok']);
    }
}
