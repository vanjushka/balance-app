<?php

namespace App\Controllers;

use App\Models\SymptomLog;
use Illuminate\Http\Request;

class SymptomController
{
    /** LIST: GET /api/symptoms?from=YYYY-MM-DD&to=YYYY-MM-DD&per_page=20 */
    public function index(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'from'     => ['sometimes','date'],
            'to'       => ['sometimes','date','after_or_equal:from'],
            'per_page' => ['sometimes','integer','min:1','max:100'],
        ]);

        $q = SymptomLog::query()->where('user_id', $user->id);

        if (isset($data['from'])) $q->where('log_date', '>=', $data['from']);
        if (isset($data['to']))   $q->where('log_date', '<=', $data['to']);

        $per = $data['per_page'] ?? 20;

        $paginator = $q->orderByDesc('log_date')->paginate($per);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    /** SHOW: GET /api/symptoms/{id} */
public function show(int $id, Request $request)
{
    $u = $request->user();
    $row = \App\Models\SymptomLog::where('id', $id)->where('user_id', $u->id)->first();
    if (!$row) return response()->json(['message' => 'Not found'], 404);

    return response()->json(['data' => $row]);
}

    /** CREATE: POST /api/symptoms (ein Log pro Tag & User) */
    public function create(Request $request)
    {
        $user = $request->user();

        $payload = $request->validate([
            'log_date'       => ['required','date'],
            'pain_intensity' => ['required','integer','min:0','max:10'],
            'energy_level'   => ['required','in:low,medium,high'],
            'mood'           => ['required','in:calm,stressed,sad,happy'],
            'sleep_quality'  => ['sometimes','nullable','integer','min:0','max:10'],
            'stress_level'   => ['sometimes','nullable','integer','min:0','max:10'],
            'notes'          => ['sometimes','nullable','string'],
            'tags_json'      => ['sometimes','array'],
        ]);

        // Eintrag auf Benutzerebene
        $payload['user_id'] = $user->id;

        // unique(user_id, log_date) respektieren → bei Kollision 409 zurück
        $exists = SymptomLog::where('user_id', $user->id)
            ->where('log_date', $payload['log_date'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A log for this date already exists. Use update.',
            ], 409);
        }

        $sym = SymptomLog::create($payload);

        return response()->json(['data' => $sym], 201);
    }

    /** UPDATE: PATCH /api/symptoms/{id} */
    public function update(int $id, Request $request)
    {
        $user = $request->user();
        $sym  = SymptomLog::find($id);

        if (!$sym) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ($sym->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'log_date'       => ['sometimes','date'],
            'pain_intensity' => ['sometimes','integer','min:0','max:10'],
            'energy_level'   => ['sometimes','in:low,medium,high'],
            'mood'           => ['sometimes','in:calm,stressed,sad,happy'],
            'sleep_quality'  => ['sometimes','nullable','integer','min:0','max:10'],
            'stress_level'   => ['sometimes','nullable','integer','min:0','max:10'],
            'notes'          => ['sometimes','nullable','string'],
            'tags_json'      => ['sometimes','array'],
        ]);

        // falls log_date geändert wird, erneut unique(user_id, log_date) absichern
        if (array_key_exists('log_date', $data)) {
            $collision = SymptomLog::where('user_id', $user->id)
                ->where('log_date', $data['log_date'])
                ->where('id', '!=', $sym->id)
                ->exists();

            if ($collision) {
                return response()->json([
                    'message' => 'Another log already exists for the given date.',
                ], 409);
            }
        }

        $sym->fill($data)->save();

        return response()->json(['data' => $sym->fresh()], 200);
    }

    /** DELETE: DELETE /api/symptoms/{id} */
    public function destroy(int $id, Request $request)
    {
        $user = $request->user();
        $sym  = SymptomLog::find($id);

        if (!$sym) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ($sym->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $sym->delete();

        return response()->json([], 204);
    }
}
