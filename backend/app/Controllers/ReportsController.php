<?php

namespace App\Controllers;

use App\Models\Report;
use App\Models\SymptomLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportsController
{
    /** GET /api/reports */
    public function index(Request $request)
    {
        $u = $request->user();
        $per = (int) $request->query('per_page', 20);
        $per = max(1, min($per, 100));

        $paginator = Report::where('user_id', $u->id)
            ->orderByDesc('generated_at')
            ->paginate($per);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 200);
    }

    /** GET /api/reports/{id} */
    public function show(int $id, Request $request)
    {
        $u = $request->user();

        $rep = Report::where('id', $id)
            ->where('user_id', $u->id)
            ->first();

        if (!$rep) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['data' => $rep], 200);
    }

    /** POST /api/reports  Body: { "period_start": "YYYY-MM-DD", "period_end": "YYYY-MM-DD" } */
    public function create(Request $request)
    {
        $u = $request->user();

        $data = $request->validate([
            'period_start' => ['required','date'],
            'period_end'   => ['required','date','after_or_equal:period_start'],
        ]);

        $from = Carbon::parse($data['period_start'])->startOfDay();
        $to   = Carbon::parse($data['period_end'])->endOfDay();

        // Logs für Zeitraum holen (leichtgewichtig)
        $logs = SymptomLog::query()
            ->where('user_id', $u->id)
            ->whereBetween('log_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('log_date')
            ->get(['log_date','pain_intensity','energy_level','mood']);

        $avgPain = round((float) $logs->avg('pain_intensity'), 2);

        // HTML für PDF erzeugen
        $html = $this->viewContent(
            $u->email,
            $from->toDateString(),
            $to->toDateString(),
            $avgPain,
            $logs
        );

        // PDF generieren
        $pdf = Pdf::loadHTML($html)->setPaper('a4');

        // Datei-Pfad (public disk)
        $path = "reports/{$u->id}/report_" . now()->timestamp . ".pdf";
        Storage::disk('public')->put($path, $pdf->output());

        // Eintrag speichern
        $report = Report::create([
            'user_id'      => $u->id,
            'period_start' => $from->toDateString(),
            'period_end'   => $to->toDateString(),
            'file_path'    => $path,
            'generated_at' => now(),
        ]);

        return response()->json(['data' => $report], 201);
    }

    /** GET /api/reports/{id}/download */
    public function download(int $id, Request $request)
    {
        $u = $request->user();
        $rep = Report::find($id);

        if (!$rep) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ($rep->user_id !== $u->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $abs = Storage::disk('public')->path($rep->file_path);
        if (!file_exists($abs)) {
            return response()->json(['message' => 'File missing'], 410);
        }

        return response()->download($abs, basename($abs));
    }

    /** DELETE /api/reports/{id} */
    public function destroy(int $id, Request $request)
    {
        $u = $request->user();
        $rep = Report::find($id);

        if (!$rep) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ($rep->user_id !== $u->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        Storage::disk('public')->delete($rep->file_path);
        $rep->delete();

        return response()->json([], 204);
    }

    /** --------- Private HTML-Helper für das PDF --------- */
    private function viewContent(string $email, string $from, string $to, float $avgPain, $logs): string
    {
        $rows = '';
        foreach ($logs as $l) {
            $date = method_exists($l->log_date, 'toDateString') ? $l->log_date->toDateString() : (string) $l->log_date;
            $rows .= '<tr>'.
                '<td style="padding:4px;border:1px solid #ccc;">'.$date.'</td>'.
                '<td style="padding:4px;border:1px solid #ccc;">'.$l->pain_intensity.'</td>'.
                '<td style="padding:4px;border:1px solid #ccc;">'.$l->energy_level.'</td>'.
                '<td style="padding:4px;border:1px solid #ccc;">'.$l->mood.'</td>'.
            '</tr>';
        }

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
    <div><strong>User:</strong> {$email}</div>
    <div><strong>Range:</strong> {$from} – {$to}</div>
    <div><strong>Average pain:</strong> {$avgPain}</div>
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
