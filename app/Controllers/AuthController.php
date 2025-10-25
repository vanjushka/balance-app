<?php

namespace App\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email|max:190',
            'password' => 'required|string|max:64',
        ]);

        // normalize email
        $email = strtolower(trim($data['email']));

        $user = User::where('email', $email)->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            // 401 für invalid creds; neutrale Message
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user'  => $user->fresh(), // sicherheitshalber frisch laden
            'token' => $token,
        ], 200);
    }

    public function logout(Request $request)
    {
        // ?all=1 -> revoke all tokens
        if ($request->boolean('all')) {
            $request->user()->tokens()->delete();
        } else {
            $request->user()->currentAccessToken()?->delete();
        }
        return response()->json(['message' => 'ok'], 200);
    }
}
