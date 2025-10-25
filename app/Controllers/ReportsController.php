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
        ]);
    }

    /** POST /api/reports  {period_start, period_end} */
    public function create(Request $request)
    {
        $u = $request->user();

        $data = $request->validate([
            'period_start' => ['required','date'],
            'period_end'   => ['required','date','after_or_equal:period_start'],
        ]);

        $from = Carbon::parse($data['period_start'])->startOfDay();
        $to   = Carbon::parse($data['period_end'])->endOfDay();

        // Datenbasis holen (leichtgewichtig)
        $logs = SymptomLog::query()
            ->where('user_id', $u->id)
            ->whereBetween('log_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('log_date')
            ->get(['log_date','pain_intensity','energy_level','mood']);

        $avgPain = round((float)$logs->avg('pain_intensity'), 2);

        // Sehr einfache HTML-Vorlage direkt als String (kein Blade nötig)
        $html = viewContent($u->email, $from->toDateString(), $to->toDateString(), $avgPain, $logs);

        $pdf = Pdf::loadHTML($html)->setPaper('a4');
        $path = "reports/{$u->id}/report_".now()->timestamp.".pdf";

        // Speichern auf 'public' Disk
        Storage::disk('public')->put($path, $pdf->output());

        $report = Report::create([
            'user_id'      => $u->id,
            'period_start' => $from,
            'period_end'   => $to,
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

        if (!$rep) return response()->json(['message'=>'Not found'], 404);
        if ($rep->user_id !== $u->id) return response()->json(['message'=>'Forbidden'], 403);

        $abs = Storage::disk('public')->path($rep->file_path);
        if (!file_exists($abs)) return response()->json(['message'=>'File missing'], 410);

        return response()->download($abs, basename($abs));
    }

    /**
     * DELETE /api/reports   (dein aktuelles Routing ohne ID)
     * Erwartet: ?id=123  ODER JSON { "id": 123 }
     * Falls du die Route auf /api/reports/{id} umstellst, kannst du destroyById nutzen.
     */
    public function destroy(Request $request)
    {
        $request->validate(['id' => ['required','integer']]);
        $id = (int) $request->input('id');

        $u = $request->user();
        $rep = Report::find($id);

        if (!$rep) return response()->json(['message'=>'Not found'], 404);
        if ($rep->user_id !== $u->id) return response()->json(['message'=>'Forbidden'], 403);

        // Datei löschen (falls vorhanden)
        Storage::disk('public')->delete($rep->file_path);
        $rep->delete();

        return response()->json([], 204);
    }
}

/** ----------------- private helper (unten in der Datei) ----------------- */
if (!function_exists('viewContent')) {
    function viewContent(string $email, string $from, string $to, float $avgPain, $logs): string
    {
        $rows = '';
        foreach ($logs as $l) {
            $rows .= '<tr>'.
                '<td style="padding:4px;border:1px solid #ccc;">'.$l->log_date->toDateString().'</td>'.
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
