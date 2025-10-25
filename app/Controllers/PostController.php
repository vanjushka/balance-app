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

        $q = Post::query()->with('user')->withCount('likes');

        if (isset($data['user_id'])) {
            $q->where('user_id', (int)$data['user_id']);
        }

        // Sortierung
        $sort = $data['sort'] ?? 'latest';
        if ($sort === 'popular') {
            $q->orderByDesc('likes_count')->orderByDesc('id');
        } else {
            $q->latest('id');
        }

        $per = $data['per_page'] ?? 20;
        $p = $q->paginate($per);

        // shape: author minimal (id,email), likes_count
        $rows = collect($p->items())->map(function (Post $post) {
            return [
                'id'         => $post->id,
                'body'       => $post->body,
                'image_url'  => $post->image_url,
                'likes_count'=> $post->likes_count ?? $post->likes()->count(),
                'author'     => [
                    'id'    => $post->user->id,
                    'email' => $post->user->email,
                ],
                'created_at' => $post->created_at?->toISOString(),
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
        ]);
    }

    /** SHOW: GET /api/posts/{id} */
    public function show(int $id, Request $request)
    {
        $post = Post::with('user')->withCount('likes')->find($id);
        if (!$post) return response()->json(['message' => 'Not found'], 404);

        return response()->json([
            'data' => [
                'id'         => $post->id,
                'body'       => $post->body,
                'image_url'  => $post->image_url,
                'likes_count'=> $post->likes_count,
                'author'     => [
                    'id'    => $post->user->id,
                    'email' => $post->user->email,
                ],
                'created_at' => $post->created_at?->toISOString(),
            ]
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
        ]);

        $post->load('user');

        return response()->json([
            'data' => [
                'id'         => $post->id,
                'body'       => $post->body,
                'image_url'  => $post->image_url,
                'likes_count'=> 0,
                'author'     => ['id'=>$u->id, 'email'=>$u->email],
                'created_at' => $post->created_at?->toISOString(),
            ],
        ], 201);
    }

    /** UPDATE: PATCH /api/posts/{id} */
    public function update(int $id, Request $request)
    {
        $u = $request->user();
        $post = Post::find($id);
        if (!$post) return response()->json(['message'=>'Not found'], 404);
        if ($post->user_id !== $u->id) return response()->json(['message'=>'Forbidden'], 403);

        $data = $request->validate([
            'body'      => ['sometimes','string'],
            'image_url' => ['sometimes','nullable','url','max:2048'],
        ]);

        $post->fill($data)->save();
        $post->load('user');

        return response()->json([
            'data' => [
                'id'         => $post->id,
                'body'       => $post->body,
                'image_url'  => $post->image_url,
                'likes_count'=> $post->likes()->count(),
                'author'     => ['id'=>$post->user->id, 'email'=>$post->user->email],
                'created_at' => $post->created_at?->toISOString(),
            ],
        ], 200);
    }

    /** DELETE: DELETE /api/posts/{id} */
    public function destroy(int $id, Request $request)
    {
        $u = $request->user();
        $post = Post::find($id);
        if (!$post) return response()->json(['message'=>'Not found'], 404);
        if ($post->user_id !== $u->id) return response()->json(['message'=>'Forbidden'], 403);

        // Likes werden per FK cascade gelöscht
        $post->delete();
        return response()->json([], 204);
    }

    /** LIKE TOGGLE: POST /api/posts/{id}/like */
    public function like(int $id, Request $request)
    {
        $u = $request->user();
        $post = Post::find($id);
        if (!$post) return response()->json(['message'=>'Not found'], 404);

        $existing = PostLike::where('post_id', $id)->where('user_id', $u->id)->first();
        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            PostLike::create(['post_id'=>$id, 'user_id'=>$u->id]);
            $liked = true;
        }

        return response()->json([
            'liked'       => $liked,
            'likes_count' => $post->likes()->count(),
        ], 200);
    }
}
