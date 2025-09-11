<?php

namespace App\Controllers;

use Illuminate\Http\Request;

class CommentsController
{
    public function index(Request $request)   { return response()->json(['data' => [], 'meta' => []]); }
    public function create(Request $request)  { return response()->json(['todo' => 'create comment'], 501); }
    public function update(Request $request)  { return response()->json(['todo' => 'update comment'], 501); }
    public function destroy(Request $request) { return response()->json(['todo' => 'delete comment'], 501); }
}
