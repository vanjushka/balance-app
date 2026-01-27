<?php

namespace App\Controllers;

use App\Models\SymptomLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SymptomController
{
    private const ALLOWED_TAGS = [
        'cramps','bloating','fatigue','headache','back_pain','joint_pain','breast_tenderness','nausea','dizziness',
        'acne','oily_skin','dry_skin','hair_loss','excess_hair_growth',
        'constipation','diarrhea','gas','stomach_pain',
        'anxious','irritable','low_mood','brain_fog','mood_swings',
        'insomnia','restless_sleep','night_sweats',
        'heavy_flow','light_flow','spotting','missed_period','irregular_cycle','clotting',
    ];

    public function index(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'date'     => ['sometimes', 'date'],
            'from'     => ['sometimes', 'date'],
            'to'       => ['sometimes', 'date', 'after_or_equal:from'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $q = SymptomLog::query()->where('user_id', $user->id);

        if (isset($data['date'])) {
            $q->whereDate('log_date', $data['date']);
        } else {
            if (isset($data['from'])) $q->whereDate('log_date', '>=', $data['from']);
            if (isset($data['to']))   $q->whereDate('log_date', '<=', $data['to']);
        }

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

    public function show(int $id, Request $request)
    {
        $user = $request->user();

        $row = SymptomLog::query()
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$row) return response()->json(['message' => 'Not found'], 404);

        return response()->json(['data' => $row]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        $payload = $request->validate([
            'log_date'       => ['required','date'],
            'pain_intensity' => ['nullable','integer','min:0','max:10'],
            'energy_level'   => ['nullable','in:depleted,low,moderate,good,energized'],
            'mood'           => ['nullable','in:calm,stressed,sad,happy'],
            'sleep_quality'  => ['sometimes','nullable','integer','min:0','max:10'],
            'stress_level'   => ['sometimes','nullable','integer','min:0','max:10'],
            'notes'          => ['sometimes','nullable','string'],
            'tags_json'      => ['nullable','array'],
            'tags_json.*'    => ['string', Rule::in(self::ALLOWED_TAGS)],
        ]);

        $payload['user_id'] = $user->id;

        $exists = SymptomLog::query()
            ->where('user_id', $user->id)
            ->whereDate('log_date', $payload['log_date'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A log for this date already exists. Use update.',
            ], 409);
        }

        $sym = SymptomLog::create($payload);

        return response()->json(['data' => $sym], 201);
    }

    public function update(int $id, Request $request)
    {
        $user = $request->user();

        $sym = SymptomLog::find($id);
        if (!$sym) return response()->json(['message' => 'Not found'], 404);
        if ($sym->user_id !== $user->id) return response()->json(['message' => 'Forbidden'], 403);

        $data = $request->validate([
            'log_date'       => ['sometimes','date'],
            'pain_intensity' => ['sometimes','nullable','integer','min:0','max:10'],
            'energy_level'   => ['sometimes','nullable','in:depleted,low,moderate,good,energized'],
            'mood'           => ['sometimes','nullable','in:calm,stressed,sad,happy'],
            'sleep_quality'  => ['sometimes','nullable','integer','min:0','max:10'],
            'stress_level'   => ['sometimes','nullable','integer','min:0','max:10'],
            'notes'          => ['sometimes','nullable','string'],
            'tags_json'      => ['sometimes','nullable','array'],
            'tags_json.*'    => ['sometimes','string', Rule::in(self::ALLOWED_TAGS)],
        ]);

        if (array_key_exists('log_date', $data)) {
            $collision = SymptomLog::query()
                ->where('user_id', $user->id)
                ->whereDate('log_date', $data['log_date'])
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

    public function destroy(int $id, Request $request)
    {
        $user = $request->user();

        $sym = SymptomLog::find($id);
        if (!$sym) return response()->json(['message' => 'Not found'], 404);
        if ($sym->user_id !== $user->id) return response()->json(['message' => 'Forbidden'], 403);

        $sym->delete();

        return response()->json([], 204);
    }
}
