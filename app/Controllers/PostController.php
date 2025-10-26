<?php

namespace App\Controllers;

use App\Models\Post;
use App\Models\PostLike;
use Illuminate\Http\Request;

class PostController
{
    /** LIST: GET /api/posts?user_id=&sort=latest|popular&per_page=20 */
    public function index(Request $request)
    {
        $data = $request->validate([
            'user_id'  => ['sometimes','integer'],
            'sort'     => ['sometimes','in:latest,popular'],
            'per_page' => ['sometimes','integer','min:1','max:100'],
        ]);

        $q = Post::query()
            ->with(['user:id,email'])
            ->withCount('likes');

        if (isset($data['user_id'])) {
            $q->where('user_id', (int) $data['user_id']);
        }

        $sort = $data['sort'] ?? 'latest';
        if ($sort === 'popular') {
            $q->orderByDesc('likes_count')->orderByDesc('id');
        } else {
            $q->latest('id');
        }

        $per = $data['per_page'] ?? 20;
        $paginator = $q->paginate($per);

        $rows = collect($paginator->items())->map(fn (Post $post) => [
            'id'          => $post->id,
            'body'        => $post->body,
            'image_url'   => $post->image_url,
            'likes_count' => $post->likes_count,
            'author'      => ['id' => $post->user->id, 'email' => $post->user->email],
            'created_at'  => $post->created_at?->toISOString(),
        ]);

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    /** SHOW: GET /api/posts/{id} (öffentlich sichtbar innerhalb auth) */
    public function show(int $id, Request $request)
    {
        $p = Post::with(['user:id,email'])->withCount('likes')->find($id);
        if (!$p) return response()->json(['message' => 'Not found'], 404);

        return response()->json([
            'data' => [
                'id'          => $p->id,
                'body'        => $p->body,
                'image_url'   => $p->image_url,
                'likes_count' => $p->likes_count,
                'author'      => ['id' => $p->user->id, 'email' => $p->user->email],
                'created_at'  => $p->created_at?->toISOString(),
            ],
        ], 200);
    }

    /** CREATE: POST /api/posts */
    public function create(Request $request)
    {
        $u = $request->user();

        $data = $request->validate([
            'body'      => ['required','string'],
            'image_url' => ['sometimes','nullable','url','max:2048'],
        ]);

        $post = Post::create([
            'user_id'   => $u->id,
            'body'      => $data['body'],
            'image_url' => $data['image_url'] ?? null,
        ])->load('user:id,email');

        return response()->json([
            'data' => [
                'id'          => $post->id,
                'body'        => $post->body,
                'image_url'   => $post->image_url,
                'likes_count' => 0,
                'author'      => ['id' => $post->user->id, 'email' => $post->user->email],
                'created_at'  => $post->created_at?->toISOString(),
            ],
        ], 201);
    }

    /** UPDATE: PATCH /api/posts/{id} (nur Owner) */
    public function update(int $id, Request $request)
    {
        $u = $request->user();
        $post = Post::find($id);
        if (!$post) return response()->json(['message' => 'Not found'], 404);
        if ($post->user_id !== $u->id) return response()->json(['message' => 'Forbidden'], 403);

        $data = $request->validate([
            'body'      => ['sometimes','string'],
            'image_url' => ['sometimes','nullable','url','max:2048'],
        ]);

        $post->fill($data)->save();
        $post->load('user:id,email')->loadCount('likes');

        return response()->json([
            'data' => [
                'id'          => $post->id,
                'body'        => $post->body,
                'image_url'   => $post->image_url,
                'likes_count' => $post->likes_count,
                'author'      => ['id' => $post->user->id, 'email' => $post->user->email],
                'created_at'  => $post->created_at?->toISOString(),
            ],
        ], 200);
    }

    /** DELETE: DELETE /api/posts/{id} (nur Owner) */
    public function destroy(int $id, Request $request)
    {
        $u = $request->user();
        $post = Post::find($id);
        if (!$post) return response()->json(['message' => 'Not found'], 404);
        if ($post->user_id !== $u->id) return response()->json(['message' => 'Forbidden'], 403);

        $post->delete(); // Likes & Comments via FK-Cascade
        return response()->json([], 204);
    }

    /** LIKE TOGGLE: POST /api/posts/{id}/like */
    public function like(int $id, Request $request)
    {
        $u = $request->user();
        $post = Post::find($id);
        if (!$post) return response()->json(['message' => 'Not found'], 404);

        $existing = PostLike::where('post_id', $id)->where('user_id', $u->id)->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            PostLike::create(['post_id' => $id, 'user_id' => $u->id]);
            $liked = true;
        }

        $count = PostLike::where('post_id', $id)->count();

        return response()->json([
            'liked'       => $liked,
            'likes_count' => $count,
        ], 200);
    }
}
