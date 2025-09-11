<?php

namespace App\Controllers;

use Illuminate\Http\Request;

class SymptomController
{
    public function index(Request $request)   { return response()->json(['data' => [], 'meta' => []]); }
    public function create(Request $request)  { return response()->json(['todo' => 'create symptom'], 501); }
    public function update(Request $request)  { return response()->json(['todo' => 'update symptom'], 501); }
    public function destroy(Request $request) { return response()->json(['todo' => 'delete symptom'], 501); }
}
