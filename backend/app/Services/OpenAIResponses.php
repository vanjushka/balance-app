<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OpenAIResponses
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model = 'gpt-4.1'
    ) {}

    public function createText(string $input, ?string $instructions = null): string
    {
        $res = Http::withToken($this->apiKey)
            ->acceptJson()
            ->timeout(30)
            ->post('https://api.openai.com/v1/responses', [
                'model' => $this->model,
                'input' => $input,
                ...( $instructions ? ['instructions' => $instructions] : [] ),
            ]);

        if (!$res->successful()) {
            $msg = $res->json('error.message') ?? 'OpenAI request failed';
            throw new \RuntimeException($msg);
        }

        // Responses API returns a convenience field: output_text
        $text = $res->json('output_text');
        if (!is_string($text) || trim($text) === '') {
            throw new \RuntimeException('OpenAI returned empty output');
        }

        return $text;
    }
}
