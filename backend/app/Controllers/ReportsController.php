<?php

namespace App\Controllers;

use App\Models\Report;
use App\Models\SymptomLog;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportsController
{
    public function index(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) $request->query('per_page', 20);

        $paginator = Report::query()
            ->where('user_id', $user->id)
            ->orderByDesc('generated_at')
            ->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ], 200);
    }

    public function show(int $id, Request $request)
    {
        $user = $request->user();

        $report = Report::query()
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$report) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['data' => $report], 200);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
        ]);

        $timezone = config('app.timezone', 'UTC');

        $from = Carbon::parse($data['period_start'], $timezone)->startOfDay();
        $to = Carbon::parse($data['period_end'], $timezone)->startOfDay();

        $logs = SymptomLog::query()
            ->where('user_id', $user->id)
            ->whereBetween('log_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('log_date', 'asc')
            ->get(['log_date', 'pain_intensity', 'energy_level', 'mood']);

        $avgPain = $logs->count() > 0
            ? round((float) $logs->avg('pain_intensity'), 2)
            : 0.0;

        $html = $this->renderPdfHtml(
            (string) $user->email,
            $from->toDateString(),
            $to->toDateString(),
            $avgPain,
            $logs
        );

        $pdf = Pdf::loadHTML($html)->setPaper('a4');

        $path = 'reports/' . $user->id . '/report_' . Str::uuid()->toString() . '.pdf';
        Storage::disk('public')->put($path, $pdf->output());

        $report = Report::create([
            'user_id' => $user->id,
            'period_start' => $from->toDateString(),
            'period_end' => $to->toDateString(),
            'file_path' => $path,
            'generated_at' => Carbon::now($timezone),
        ]);

        return response()->json(['data' => $report], 201);
    }

    public function download(int $id, Request $request)
    {
        $user = $request->user();

        $report = Report::find($id);
        if (!$report) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ((int) $report->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $disk = Storage::disk('public');

        if (!$report->file_path || !$disk->exists($report->file_path)) {
            return response()->json(['message' => 'File missing'], 410);
        }

        $absPath = $disk->path($report->file_path);

        return response()->download($absPath, basename($absPath), [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function destroy(int $id, Request $request)
    {
        $user = $request->user();

        $report = Report::find($id);
        if (!$report) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ((int) $report->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $disk = Storage::disk('public');

        if ($report->file_path && $disk->exists($report->file_path)) {
            $disk->delete($report->file_path);
        }

        $report->delete();

        return response()->noContent();
    }

    private function renderPdfHtml(string $email, string $from, string $to, float $avgPain, $logs): string
    {
        $esc = static fn (string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $rows = '';
        foreach ($logs as $l) {
            $date = is_object($l->log_date) && method_exists($l->log_date, 'toDateString')
                ? $l->log_date->toDateString()
                : (string) $l->log_date;

            $rows .= '<tr>'
                . '<td style="padding:4px;border:1px solid #ccc;">' . $esc($date) . '</td>'
                . '<td style="padding:4px;border:1px solid #ccc;">' . $esc((string) ($l->pain_intensity ?? '')) . '</td>'
                . '<td style="padding:4px;border:1px solid #ccc;">' . $esc((string) ($l->energy_level ?? '')) . '</td>'
                . '<td style="padding:4px;border:1px solid #ccc;">' . $esc((string) ($l->mood ?? '')) . '</td>'
                . '</tr>';
        }

        $emailEsc = $esc($email);
        $fromEsc = $esc($from);
        $toEsc = $esc($to);
        $avgPainEsc = $esc((string) $avgPain);

        return <<<HTML
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Doctor Snapshot</title>
  <style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
    h1 { font-size: 18px; margin-bottom: 10px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 4px; text-align: left; }
    .meta { margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>Doctor Snapshot</h1>
  <div class="meta">
    <div>User: {$emailEsc}</div>
    <div>Range: {$fromEsc} – {$toEsc}</div>
    <div>Average pain: {$avgPainEsc}</div>
  </div>
  <table>
    <thead>
      <tr><th>Date</th><th>Pain</th><th>Energy</th><th>Mood</th></tr>
    </thead>
    <tbody>
      {$rows}
    </tbody>
  </table>
</body>
</html>
HTML;
    }
}
