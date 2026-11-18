<?php

namespace Tests\Feature;

use App\Models\TrialAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TrialTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.target' => 'player',
            'services.onestream.url' => 'https://panel.test',
            'services.onestream.api_token' => 'api-token',
            'services.onestream.user_token' => 'user-token',
            'services.onestream.trial_days' => 30,
            'services.onestream.trial_bouquets' => [2, 3, 4, 5],
        ]);
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
    }

    private function fakePanel(array $create = ['line_id' => 'uuid-555'], array $lines = []): void
    {
        Http::fake([
            'panel.test/ext/lines*' => Http::response($lines),
            'panel.test/ext/line/create-advanced' => Http::response($create),
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Juan Perez Quispe',
            'dni' => '12345678',
            'address' => 'Av. Principal 123',
            'city' => 'Pichanaki',
            'phone' => '987654321',
            'username' => 'juanperez',
            'password' => 'clave123',
            ...$overrides,
        ];
    }

    public function test_creates_line_in_panel_and_registers_trial(): void
    {
        $this->fakePanel();

        $this->postJson('/api/trial', $this->payload())
            ->assertCreated()
            ->assertJson(['username' => 'juanperez', 'days' => 30]);

        Http::assertSent(fn (Request $r) => $r->url() === 'https://panel.test/ext/lines?username=juanperez'
            && $r->hasHeader('X-Auth-User', 'user-token'));
        Http::assertSent(fn (Request $r) => $r->url() === 'https://panel.test/ext/line/create-advanced'
            && $r->hasHeader('X-Api-Key', 'api-token')
            && $r->hasHeader('X-Auth-User', 'user-token')
            && $r['username'] === 'juanperez'
            && $r['password'] === 'clave123'
            && $r['is_trial'] === true
            && $r['max_connections'] === 1
            && $r['bouquets'] === [2, 3, 4, 5]
            && str_starts_with($r['rid'], 'web-trial-')
            && abs(now()->addDays(30)->getTimestamp() - strtotime($r['expire_at'])) < 60);

        $trial = TrialAccount::sole();
        $this->assertSame('uuid-555', $trial->panel_line_id);
        $this->assertSame(30, (int) round(now()->diffInDays($trial->expires_at)));
        $this->assertArrayNotHasKey('password', $trial->getAttributes());
    }

    public function test_one_trial_per_dni_and_phone(): void
    {
        $this->fakePanel();
        $this->postJson('/api/trial', $this->payload())->assertCreated();

        $this->postJson('/api/trial', $this->payload(['username' => 'otro123', 'phone' => '911111111']))
            ->assertStatus(422)->assertJsonValidationErrors('dni');
        $this->postJson('/api/trial', $this->payload(['username' => 'otro123', 'dni' => '87654321']))
            ->assertStatus(422)->assertJsonValidationErrors('phone');
        Http::assertSentCount(2);
    }

    public function test_rejects_invalid_fields_without_calling_panel(): void
    {
        Http::fake();

        $this->postJson('/api/trial', $this->payload(['dni' => '123', 'phone' => '12345', 'username' => 'Juan Perez', 'password' => '12']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['dni', 'phone', 'username', 'password']);
        Http::assertNothingSent();
    }

    public function test_panel_failure_frees_the_dni_for_retry(): void
    {
        Http::fake([
            'panel.test/ext/lines*' => Http::response([]),
            'panel.test/ext/line/create-advanced' => Http::sequence()
                ->push(['error' => 'Failed to Authenticate'])
                ->push(['line_id' => 'uuid-9']),
        ]);

        $this->postJson('/api/trial', $this->payload())->assertStatus(502);
        $this->assertSame(0, TrialAccount::count());

        $this->postJson('/api/trial', $this->payload())->assertCreated();
    }

    public function test_username_already_in_panel_is_rejected_without_creating(): void
    {
        $this->fakePanel(lines: [['line_id' => 'x', 'username' => 'juanperez']]);

        $this->postJson('/api/trial', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('username');
        Http::assertNotSent(fn (Request $r) => str_contains($r->url(), 'create-advanced'));
        $this->assertSame(0, TrialAccount::count());
    }

    public function test_honeypot_blocks_bots(): void
    {
        Http::fake();

        $this->postJson('/api/trial', $this->payload(['website' => 'spam']))->assertStatus(422);
        Http::assertNothingSent();
    }
}
