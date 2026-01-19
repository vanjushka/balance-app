<?php

namespace App\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class UserController
{
    /** Register */
    public function create(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required','email','max:190','unique:users,email'],
            'password' => ['required','string','min:8','max:64','confirmed'], // expects password_confirmation
            'profile'  => ['sometimes','array'],
        ]);

        $email = strtolower(trim($data['email']));

        $user = User::create([
            'email'    => $email,
            'password' => $data['password'], // hashed via mutator
            'profile'  => $data['profile'] ?? null,
            'is_admin' => false,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['user' => $user->fresh(), 'token' => $token], 201);
    }

    /** Me */
    public function index(Request $request)
    {
        return response()->json(['user' => $request->user()], 200);
    }

    /** Update me */
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'email'    => ['sometimes','email','max:190', Rule::unique('users','email')->ignore($user->id)],
            'password' => ['sometimes','string','min:8','max:64','confirmed'], // erlaubt optionales change mit confirmation
            'profile'  => ['sometimes','array'],
        ]);

        if (array_key_exists('email', $data)) {
            $user->email = strtolower(trim($data['email']));
        }
        if (array_key_exists('password', $data)) {
            $user->password = $data['password']; // mutator hashes
        }
        if (array_key_exists('profile', $data)) {
            $user->profile = $data['profile'];
        }

        $user->save();

        return response()->json(['user' => $user->fresh()], 200);
    }

    /** Delete account (+ cleanup files like reports) */
public function destroy(Request $request)
{
    $user = $request->user();

    // 1. Logout & Session cleanup 
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    // 2. Cleanup reports / files 
    if (method_exists($user, 'reports')) {
        foreach ($user->reports as $rep) {
            if (!empty($rep->file_path)) {
                try {
                    Storage::disk('reports')->delete($rep->file_path);
                } catch (\Throwable $e) {
                    Storage::disk('public')->delete($rep->file_path);
                }
            }
        }
    }

    // 3. Delete user (cascade)
    $user->delete();

    return response()->json(['message' => 'Account deleted'], 200);
}
}
