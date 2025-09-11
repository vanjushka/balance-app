<?php

namespace App\Controllers;

use Illuminate\Http\Request;

class ReportsController
{
    public function index(Request $request)     { return response()->json(['data' => []]); }
    public function create(Request $request)    { return response()->json(['todo' => 'create report'], 501); }
    public function download(Request $request, $id) { return response()->json(['todo' => 'download report', 'id' => (int)$id], 501); }
    public function destroy(Request $request)   { return response()->json(['todo' => 'delete report'], 501); }
}
