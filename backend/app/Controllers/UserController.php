<?php

namespace App\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UserController
{
    public function create(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:64', 'confirmed'],
            'profile' => ['nullable', 'array'],
            'profile.display_name' => ['sometimes', 'nullable', 'string', 'min:2', 'max:40'],
        ]);

        $email = strtolower(trim($data['email']));

        $profile = $this->normalizeProfile($data['profile'] ?? null);

        $user = User::create([
            'email' => $email,
            'password' => $data['password'],
            'profile' => $profile,
            'is_admin' => false,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['user' => $user->fresh(), 'token' => $token], 201);
    }

    public function index(Request $request)
    {
        return response()->json(['user' => $request->user()], 200);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'email' => ['sometimes', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['sometimes', 'string', 'min:8', 'max:64', 'confirmed'],
            'profile' => ['sometimes', 'array'],
            'profile.display_name' => ['nullable', 'string', 'min:2', 'max:40'],
        ]);

        if (array_key_exists('email', $data)) {
            $user->email = strtolower(trim($data['email']));
        }

        if (array_key_exists('password', $data)) {
            $user->password = $data['password'];
        }

        if (array_key_exists('profile', $data)) {
            $user->profile = $this->normalizeProfile($data['profile']);
        }

        $user->save();

        return response()->json(['user' => $user->fresh()], 200);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        foreach ($user->reports()->get() as $rep) {
            if (!empty($rep->file_path)) {
                try {
                    Storage::disk('reports')->delete($rep->file_path);
                } catch (\Throwable $e) {
                    Storage::disk('public')->delete($rep->file_path);
                }
            }
        }

        $user->delete();

        return response()->json(['message' => 'Account deleted'], 200);
    }

    private function normalizeProfile(?array $profile): ?array
    {
        if ($profile === null) return null;

        if (array_key_exists('display_name', $profile)) {
            $displayName = trim((string) $profile['display_name']);
            if ($displayName === '') {
                unset($profile['display_name']);
            } else {
                $profile['display_name'] = $displayName;
            }
        }

        return $profile === [] ? null : $profile;
    }
}
