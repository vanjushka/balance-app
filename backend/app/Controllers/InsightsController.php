<?php

namespace App\Controllers;

use App\Models\InsightsSummary;
use App\Models\SymptomLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class InsightsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $range = (int) $request->query('range', 30);

        if (!in_array($range, [30, 90], true)) {
            return response()->json(['message' => 'Invalid range. Allowed: 30, 90.'], 422);
        }

        $userId = Auth::id();
        $timezone = config('app.timezone', 'UTC');

        $endDate = Carbon::now($timezone)->startOfDay();
        $startDate = (clone $endDate)->subDays($range - 1);

        $logs = SymptomLog::query()
            ->where('user_id', $userId)
            ->whereDate('log_date', '>=', $startDate->toDateString())
            ->whereDate('log_date', '<=', $endDate->toDateString())
            ->orderBy('log_date', 'asc')
            ->get([
                'log_date',
                'pain_intensity',
                'energy_level',
                'mood',
                'sleep_quality',
                'stress_level',
                'tags_json',
            ]);

        $metrics = $this->buildMetricsFromLogs($logs, $range);

        return response()->json([
            'data' => $metrics,
            'meta' => [
                'range_days' => $range,
                'date_from' => $startDate->toDateString(),
                'date_to' => $endDate->toDateString(),
                'timezone' => $timezone,
                'generated_at' => Carbon::now($timezone)->toIso8601String(),
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $range = (int) $request->input('range', 30);

        if (!in_array($range, [30, 90], true)) {
            return response()->json(['message' => 'Invalid range. Allowed: 30, 90.'], 422);
        }

        $user = $request->user();
        $timezone = config('app.timezone', 'UTC');

        $endDate = Carbon::now($timezone)->startOfDay();
        $startDate = (clone $endDate)->subDays($range - 1);

        $cached = InsightsSummary::query()
            ->where('user_id', $user->id)
            ->where('range_days', $range)
            ->whereDate('date_from', $startDate->toDateString())
            ->whereDate('date_to', $endDate->toDateString())
            ->first();

        if ($cached) {
            $payload = is_array($cached->payload) ? $cached->payload : [];
            $data = data_get($payload, 'data');

            if (is_array($data) && isset($data['summary'], $data['bullets'], $data['disclaimer'])) {
                return response()->json([
                    'data' => [
                        'summary' => (string) $data['summary'],
                        'bullets' => is_array($data['bullets']) ? array_values($data['bullets']) : [],
                        'disclaimer' => (string) $data['disclaimer'],
                    ],
                    'meta' => [
                        'range_days' => $range,
                        'date_from' => $startDate->toDateString(),
                        'date_to' => $endDate->toDateString(),
                        'timezone' => $timezone,
                        'generated_at' => optional($cached->generated_at)->toIso8601String()
                            ?? Carbon::now($timezone)->toIso8601String(),
                        'cached' => true,
                    ],
                ]);
            }
        }

        $logs = SymptomLog::query()
            ->where('user_id', $user->id)
            ->whereDate('log_date', '>=', $startDate->toDateString())
            ->whereDate('log_date', '<=', $endDate->toDateString())
            ->orderBy('log_date', 'asc')
            ->get([
                'log_date',
                'pain_intensity',
                'energy_level',
                'mood',
                'sleep_quality',
                'stress_level',
                'tags_json',
                'notes',
            ]);

        if ($logs->count() < 7) {
            $payload = [
                'data' => [
                    'summary' => 'Not enough recent check-ins to generate a meaningful summary yet.',
                    'bullets' => [
                        'Add a few more daily check-ins to unlock better insights.',
                        'Consistency matters more than detail.',
                        'Keep notes short—tags + a number is enough.',
                    ],
                    'disclaimer' => 'This is not medical advice.',
                ],
            ];

            InsightsSummary::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'range_days' => $range,
                    'date_from' => $startDate->toDateString(),
                    'date_to' => $endDate->toDateString(),
                ],
                [
                    'payload' => $payload,
                    'generated_at' => Carbon::now($timezone),
                ]
            );

            return response()->json($payload + [
                'meta' => [
                    'range_days' => $range,
                    'date_from' => $startDate->toDateString(),
                    'date_to' => $endDate->toDateString(),
                    'timezone' => $timezone,
                    'generated_at' => Carbon::now($timezone)->toIso8601String(),
                    'cached' => false,
                ],
            ]);
        }

        $metrics = $this->buildMetricsFromLogs($logs, $range);

        $system = <<<TXT
You are a supportive women's health symptom tracker assistant.
Write a short, calming reflection based ONLY on the provided metrics.
No diagnosis, no alarming language, no medical claims.
Return STRICT JSON with keys:
- summary: string (max ~90 words)
- bullets: array of 3 short bullet strings
- disclaimer: string (one sentence)
TXT;

        try {
            $ai = $this->callOpenAiJson($system, [
                'range_days' => $range,
                'date_from' => $startDate->toDateString(),
                'date_to' => $endDate->toDateString(),
                'metrics' => $metrics,
            ]);

            $summary = trim((string) ($ai['summary'] ?? ''));
            $bullets = is_array($ai['bullets'] ?? null) ? array_values($ai['bullets']) : [];
            $bullets = array_values(array_filter($bullets, fn ($b) => is_string($b) && trim($b) !== ''));
            $bullets = array_slice($bullets, 0, 3);

            $disclaimer = trim((string) ($ai['disclaimer'] ?? 'This is not medical advice.'));
            if ($summary === '') {
                $summary = 'No summary available.';
            }

            $payload = [
                'data' => [
                    'summary' => $summary,
                    'bullets' => $bullets,
                    'disclaimer' => $disclaimer,
                ],
            ];

            InsightsSummary::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'range_days' => $range,
                    'date_from' => $startDate->toDateString(),
                    'date_to' => $endDate->toDateString(),
                ],
                [
                    'payload' => $payload,
                    'generated_at' => Carbon::now($timezone),
                ]
            );

            return response()->json($payload + [
                'meta' => [
                    'range_days' => $range,
                    'date_from' => $startDate->toDateString(),
                    'date_to' => $endDate->toDateString(),
                    'timezone' => $timezone,
                    'generated_at' => Carbon::now($timezone)->toIso8601String(),
                    'cached' => false,
                ],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Failed to generate summary',
            ], 500);
        }
    }

    private function buildMetricsFromLogs($logs, int $range): array
    {
        $loggedDays = $logs->groupBy(fn ($l) => (string) $l->log_date)->count();

        $painValues = $logs->pluck('pain_intensity')->filter(fn ($v) => is_int($v));
        $stressValues = $logs->pluck('stress_level')->filter(fn ($v) => is_int($v));
        $sleepValues = $logs->pluck('sleep_quality')->filter(fn ($v) => is_int($v));

        $energyCounts = ['depleted' => 0, 'low' => 0, 'moderate' => 0, 'good' => 0, 'energized' => 0];
        foreach ($logs as $l) {
            $k = $l->energy_level;
            if (is_string($k) && array_key_exists($k, $energyCounts)) {
                $energyCounts[$k]++;
            }
        }

        $moodCounts = ['calm' => 0, 'stressed' => 0, 'sad' => 0, 'happy' => 0];
        foreach ($logs as $l) {
            $k = $l->mood;
            if (is_string($k) && array_key_exists($k, $moodCounts)) {
                $moodCounts[$k]++;
            }
        }

        $tagCounts = [];
        foreach ($logs as $l) {
            $tags = is_array($l->tags_json) ? $l->tags_json : [];
            foreach ($tags as $t) {
                if (!is_string($t) || trim($t) === '') {
                    continue;
                }
                $tag = strtolower(trim($t));
                $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
            }
        }
        arsort($tagCounts);

        $topTags = [];
        foreach (array_slice($tagCounts, 0, 8, true) as $tag => $count) {
            $topTags[] = ['tag' => $tag, 'count' => $count];
        }

        $highPainDays = $logs->filter(fn ($l) => is_int($l->pain_intensity) && $l->pain_intensity >= 6)->count();
        $highStressDays = $logs->filter(fn ($l) => is_int($l->stress_level) && $l->stress_level >= 7)->count();

        $lowEnergyDays = ($energyCounts['depleted'] ?? 0) + ($energyCounts['low'] ?? 0);

        return [
            'counts' => [
                'logged_days' => $loggedDays,
                'range_days' => $range,
            ],
            'pain' => [
                'avg' => $painValues->count() ? round($painValues->avg(), 1) : null,
                'max' => $painValues->count() ? (int) $painValues->max() : null,
                'high_days' => $highPainDays,
            ],
            'energy' => [
                'low_days' => $lowEnergyDays,
                'distribution' => $energyCounts,
            ],
            'mood' => [
                'distribution' => $moodCounts,
            ],
            'stress' => [
                'avg' => $stressValues->count() ? round($stressValues->avg(), 1) : null,
                'high_days' => $highStressDays,
            ],
            'sleep' => [
                'avg' => $sleepValues->count() ? round($sleepValues->avg(), 1) : null,
            ],
            'tags' => [
                'top' => $topTags,
            ],
        ];
    }

    private function callOpenAiJson(string $system, array $userPayload): array
    {
        $apiKey = config('services.openai.api_key');
        $model = config('services.openai.model', 'gpt-4.1');

        if (!$apiKey) {
            throw new \RuntimeException('OpenAI API key missing (services.openai.api_key)');
        }

        $res = Http::withToken($apiKey)
            ->timeout(30)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $model,
                'temperature' => 0.4,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => json_encode($userPayload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)],
                ],
            ]);

        if (!$res->ok()) {
            $msg = (string) data_get($res->json(), 'error.message', 'OpenAI request failed');
            throw new \RuntimeException($msg);
        }

        $text = data_get($res->json(), 'choices.0.message.content');

        if (!is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Empty model response');
        }

        $decoded = json_decode($text, true);

        if (!is_array($decoded)) {
            throw new \RuntimeException('Model returned invalid JSON');
        }

        return $decoded;
    }
}
