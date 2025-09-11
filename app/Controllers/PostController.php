<?php

namespace App\Controllers;

use Illuminate\Http\Request;

class PostController
{
    public function index(Request $request)   { return response()->json(['data' => [], 'meta' => []]); }
    public function create(Request $request)  { return response()->json(['todo' => 'create post'], 501); }
    public function update(Request $request)  { return response()->json(['todo' => 'update post'], 501); }
    public function destroy(Request $request) { return response()->json(['todo' => 'delete post'], 501); }
    public function like(Request $request, $id) { return response()->json(['todo' => 'toggle like', 'post_id' => (int)$id], 501); }
}
