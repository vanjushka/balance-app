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

        $user = User::create([
            'email'    => $data['email'],
            'password' => $data['password'], // hashed via mutator
            'profile'  => $data['profile'] ?? null,
            'is_admin' => false,
        ]);

        // optional: auto-login after register
        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    /** Me */
    public function index(Request $request)
    {
        return $request->user();
    }

    /** Update me */
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'email'    => ['sometimes','email','max:190', Rule::unique('users','email')->ignore($user->id)],
            'password' => ['sometimes','string','min:8','max:64'],
            'profile'  => ['sometimes','array'],
        ]);

        if (array_key_exists('email', $data))    $user->email = $data['email'];
        if (array_key_exists('password', $data)) $user->password = $data['password']; // mutator hashes
        if (array_key_exists('profile', $data))  $user->profile = $data['profile'];

        $user->save();

        return $user->fresh();
    }

    /** Delete account (+ cleanup files like reports) */
    public function destroy(Request $request)
    {
        $user = $request->user();

        // cleanup any stored private files if you already create reports/uploads later
        if (method_exists($user, 'reports')) {
            foreach ($user->reports as $rep) {
                if (!empty($rep->file_path)) {
                    Storage::disk('reports')->delete($rep->file_path);
                }
            }
        }

        $user->delete();

        return response()->json([], 204);
    }
}
