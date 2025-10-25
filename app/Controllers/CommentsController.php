<?php

namespace App\Controllers;

use App\Models\Post;
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentsController
{
    /** LIST: GET /api/posts/{postId}/comments?per_page=50 */
    public function index(int $postId, Request $request)
    {
        $request->validate([
            'per_page' => ['sometimes','integer','min:1','max:100'],
        ]);

        $post = Post::find($postId);
        if (!$post) return response()->json(['message'=>'Not found'], 404);

        $per = (int)($request->query('per_page', 50));
        $p = Comment::where('post_id', $post->id)
            ->with('user:id,email')
            ->latest('id')
            ->paginate($per);

        $rows = collect($p->items())->map(function (Comment $c) {
            return [
                'id'         => $c->id,
                'body'       => $c->body,
                'author'     => ['id'=>$c->user->id, 'email'=>$c->user->email],
                'created_at' => $c->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total'        => $p->total(),
                'per_page'     => $p->perPage(),
                'current_page' => $p->currentPage(),
                'last_page'    => $p->lastPage(),
            ],
        ], 200);
    }

    /** CREATE: POST /api/posts/{postId}/comments  { body } */
    public function create(int $postId, Request $request)
    {
        $u = $request->user();

        $payload = $request->validate([
            'body' => ['required','string'],
        ]);

        $post = Post::find($postId);
        if (!$post) return response()->json(['message'=>'Not found'], 404);

        $c = Comment::create([
            'post_id' => $post->id,
            'user_id' => $u->id,
            'body'    => $payload['body'],
        ])->load('user:id,email');

        return response()->json([
            'data' => [
                'id'         => $c->id,
                'body'       => $c->body,
                'author'     => ['id'=>$c->user->id, 'email'=>$c->user->email],
                'created_at' => $c->created_at?->toISOString(),
            ],
        ], 201);
    }

    /** UPDATE: PATCH /api/comments/{id}  { body } (nur eigener Comment) */
    public function update(int $id, Request $request)
    {
        $u = $request->user();

        $payload = $request->validate([
            'body' => ['required','string'],
        ]);

        $c = Comment::find($id);
        if (!$c) return response()->json(['message'=>'Not found'], 404);
        if ($c->user_id !== $u->id) return response()->json(['message'=>'Forbidden'], 403);

        $c->body = $payload['body'];
        $c->save();

        $c->load('user:id,email');

        return response()->json([
            'data' => [
                'id'         => $c->id,
                'body'       => $c->body,
                'author'     => ['id'=>$c->user->id, 'email'=>$c->user->email],
                'created_at' => $c->created_at?->toISOString(),
            ],
        ], 200);
    }

    /** DELETE: DELETE /api/comments/{id} (nur eigener Comment) */
    public function destroy(int $id, Request $request)
    {
        $u = $request->user();

        $c = Comment::find($id);
        if (!$c) return response()->json(['message'=>'Not found'], 404);
        if ($c->user_id !== $u->id) return response()->json(['message'=>'Forbidden'], 403);

        $c->delete();
        return response()->json([], 204);
    }
}
