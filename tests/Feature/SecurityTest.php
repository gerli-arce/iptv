<?php

namespace Tests\Feature;

use App\Logging\RedactingFormatter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_ignores_the_server_url_sent_by_the_client(): void
    {
        config(['xtream.server_url' => 'http://panel.test']);
        Http::fake(['*' => Http::response(['user_info' => ['username' => 'demo', 'auth' => 1]])]);

        $this->postJson('/api/player/login', [
            'server_url' => 'http://evil.test',
            'username' => 'demo',
            'password' => 'secret',
        ])->assertOk();

        Http::assertSent(fn ($request) => str_starts_with($request->url(), 'http://panel.test/player_api.php'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'evil.test'));
        $this->assertSame('http://panel.test', session('iptv.server_url'));
    }

    public function test_login_is_rate_limited(): void
    {
        Http::fake(['*' => Http::response([])]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/player/login', ['username' => 'demo', 'password' => 'bad'])->assertStatus(422);
        }

        $this->postJson('/api/player/login', ['username' => 'demo', 'password' => 'bad'])->assertStatus(429);
    }

    public function test_image_proxy_rejects_private_and_non_http_addresses(): void
    {
        Http::fake();

        foreach (['http://127.0.0.1/a.jpg', 'http://169.254.169.254/latest/meta-data', 'http://10.0.0.5/a.png', 'file:///etc/passwd'] as $url) {
            $this->get('/image-proxy?url=' . urlencode($url))->assertNotFound();
        }

        Http::assertNothingSent();
    }

    public function test_image_proxy_only_serves_images(): void
    {
        Http::fake(['*' => Http::response('<svg onload="alert(1)"/>', 200, ['Content-Type' => 'image/svg+xml'])]);

        $this->get('/image-proxy?url=' . urlencode('http://8.8.8.8/x.svg'))->assertStatus(415);
    }

    public function test_image_proxy_serves_a_public_image(): void
    {
        Http::fake(['*' => Http::response('PNGDATA', 200, ['Content-Type' => 'image/png'])]);

        $this->get('/image-proxy?url=' . urlencode('http://8.8.8.8/x.png'))
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_stream_proxy_requires_a_session(): void
    {
        $this->get('/stream?u=' . rtrim(strtr(base64_encode('http://panel.test/live/a/b/1.m3u8'), '+/', '-_'), '='))
            ->assertUnauthorized();
    }

    public function test_log_redaction_hides_iptv_credentials(): void
    {
        $text = RedactingFormatter::redact(
            'cURL error: http://h/player_api.php?username=60291427&password=hunter2 y http://h:80/live/60291427/hunter2/12.m3u8'
        );

        $this->assertStringNotContainsString('hunter2', $text);
        $this->assertStringNotContainsString('60291427', $text);
    }

    public function test_device_token_does_not_accept_user_id_from_the_client(): void
    {
        $this->postJson('/api/device-tokens', ['token' => 'abc123', 'user_id' => 99])->assertStatus(201);

        $this->assertDatabaseHas('device_tokens', ['token' => 'abc123', 'user_id' => null]);
    }
}
