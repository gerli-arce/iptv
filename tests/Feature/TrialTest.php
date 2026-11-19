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
            'services.onestream.trial_enabled' => true,
            'services.onestream.url' => 'https://panel.test',
            'services.onestream.api_token' => 'api-token',
            'services.onestream.user_token' => 'user-token',
            'services.onestream.trial_days' => 30,
            'services.onestream.trial_bouquets' => [2, 3, 4, 5],
            'services.dni.url' => 'https://dni.test/api/v1',
            'services.dni.key' => 'dni-key',
        ]);
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
    }

    private function dniResponse(string $first = 'JUAN CARLOS', string $paternal = 'PEREZ', string $maternal = 'QUISPE'): array
    {
        return ['success' => true, 'data' => [
            'dni' => '12345678',
            'first_name' => $first,
            'last_name_paternal' => $paternal,
            'last_name_maternal' => $maternal,
            'full_name' => trim("{$first} {$paternal} {$maternal}"),
        ]];
    }

    /** Simula DNI y panel. Por defecto el DNI es de "JUAN CARLOS PEREZ QUISPE". */
    private function fakePanel(array $create = ['line_id' => 'uuid-555'], array $lines = [], $dni = null): void
    {
        Http::fake([
            'dni.test/*' => $dni ?? Http::response($this->dniResponse()),
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
            'device_id' => 'device-aaaaaaaaaaaaaaaa',
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

        Http::assertSent(fn (Request $r) => $r->url() === 'https://dni.test/api/v1/person/12345678'
            && $r->hasHeader('Authorization', 'Bearer dni-key'));
        Http::assertSent(fn (Request $r) => str_contains($r->url(), 'create-advanced')
            && str_contains($r['admin_notes'], 'Nombre: JUAN CARLOS PEREZ QUISPE'));

        $trial = TrialAccount::sole();
        $this->assertSame('JUAN CARLOS PEREZ QUISPE', $trial->name);
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
        Http::assertSentCount(3); // DNI + busqueda de usuario + creacion; los rechazos no llaman a nadie
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
            'dni.test/*' => Http::response($this->dniResponse()),
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

    public function test_disabled_switch_blocks_creation(): void
    {
        config(['services.onestream.trial_enabled' => false]);
        Http::fake();

        $this->postJson('/api/trial', $this->payload())->assertStatus(503);
        Http::assertNothingSent();
        $this->assertSame(0, TrialAccount::count());
        $this->get('/')->assertSee('<meta name="trial-enabled" content="0">', false);
    }

    public function test_unknown_dni_is_rejected_without_touching_panel(): void
    {
        $this->fakePanel(dni: Http::response('<html>404 Not Found</html>', 404));

        $this->postJson('/api/trial', $this->payload())
            ->assertStatus(422)->assertJsonValidationErrors('dni');
        Http::assertNotSent(fn (Request $r) => str_contains($r->url(), 'panel.test'));
        $this->assertSame(0, TrialAccount::count());
    }

    public function test_name_must_match_dni_owner(): void
    {
        $this->fakePanel();

        // Otro nombre, solo nombres sin apellido, o datos de relleno de la API para numeros imposibles.
        foreach (['Pedro Gomez', 'Juan Carlos', 'Juan Perez Torres'] as $name) {
            $this->postJson('/api/trial', $this->payload(['name' => $name]))
                ->assertStatus(422)->assertJsonValidationErrors('name');
        }
        Http::assertNotSent(fn (Request $r) => str_contains($r->url(), 'panel.test'));
    }

    public function test_filler_data_from_api_does_not_pass(): void
    {
        $this->fakePanel(dni: Http::response(['success' => true, 'data' => [
            'dni' => '00000000', 'first_name' => 'LLC', 'full_name' => 'LLC Twist Printers',
            'last_name' => 'Twist Printers', 'last_name_paternal' => '', 'last_name_maternal' => '',
        ]]));

        $this->postJson('/api/trial', $this->payload(['dni' => '00000000', 'name' => 'Llc Twist Printers']))
            ->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_name_variations_of_the_owner_are_accepted(): void
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        $this->fakePanel();
        foreach (['juan perez', 'JUAN CARLOS PÉREZ QUISPE', 'Carlos Pérez', 'Juan Quispe'] as $i => $name) {
            $dni = str_pad((string) (20000000 + $i), 8, '0', STR_PAD_LEFT);
            $this->postJson('/api/trial', $this->payload([
                'name' => $name, 'dni' => $dni, 'phone' => '9' . str_pad((string) $i, 8, '0', STR_PAD_LEFT), 'username' => "user{$i}x",
                'device_id' => "device-variation-{$i}xxxxxx",
            ]))->assertCreated();
        }
    }

    public function test_dni_service_down_does_not_create_account(): void
    {
        $this->fakePanel(dni: Http::response(['message' => 'error'], 500));

        $this->postJson('/api/trial', $this->payload())->assertStatus(503);
        Http::assertNotSent(fn (Request $r) => str_contains($r->url(), 'panel.test'));
        $this->assertSame(0, TrialAccount::count());
    }

    /** Crea una prueba distinta (DNI, celular y usuario propios) desde el dispositivo/IP indicados. */
    private function createTrial(int $n, string $device = 'device-aaaaaaaaaaaaaaaa', string $ip = '10.0.0.1')
    {
        return $this->withServerVariables(['REMOTE_ADDR' => $ip])->postJson('/api/trial', $this->payload([
            'dni' => (string) (30000000 + $n),
            'phone' => (string) (911000000 + $n),
            'username' => "cliente{$n}",
            'device_id' => $device,
        ]));
    }

    public function test_two_trials_per_device_per_day(): void
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        $this->fakePanel();

        $this->createTrial(1)->assertCreated();
        $this->createTrial(2)->assertCreated();
        $this->createTrial(3)->assertStatus(429)->assertJson(['daily_limit' => true]);

        // Otro dispositivo si puede; y al dia siguiente (hora de Lima) el mismo vuelve a tener cupo.
        $this->createTrial(4, 'device-bbbbbbbbbbbbbbbb')->assertCreated();
        $this->travelTo(now('America/Lima')->addDay()->startOfDay()->addHour());
        $this->createTrial(5)->assertCreated();
    }

    public function test_four_trials_per_ip_per_day_and_no_global_cap(): void
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        $this->fakePanel();

        // Misma IP con navegadores distintos: 4 permitidas, la quinta no.
        foreach ([1, 2, 3, 4] as $n) {
            $this->createTrial($n, "device-ip-limit-{$n}xxxxxxx")->assertCreated();
        }
        $this->createTrial(5, 'device-ip-limit-5xxxxxxx')->assertStatus(429)->assertJson(['daily_limit' => true]);

        // Sin tope general: desde otras IPs se siguen creando.
        foreach (range(6, 12) as $n) {
            $this->createTrial($n, "device-other-{$n}xxxxxxxx", "10.0.1.{$n}")->assertCreated();
        }
        $this->assertSame(11, TrialAccount::count());
    }

    public function test_limit_checked_before_spending_dni_lookup_and_failures_do_not_count(): void
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        Http::fake([
            'dni.test/*' => Http::response($this->dniResponse()),
            'panel.test/ext/lines*' => Http::response([]),
            'panel.test/ext/line/create-advanced' => Http::sequence()
                ->push(['error' => 'boom'])->push(['line_id' => 'a'])->push(['line_id' => 'b']),
        ]);

        $this->createTrial(1)->assertStatus(502); // fallo del panel: no ocupa cupo
        $this->createTrial(2)->assertCreated();
        $this->createTrial(3)->assertCreated();

        Http::fake(); // a partir de aqui, ninguna llamada externa
        $this->createTrial(4)->assertStatus(429);
        Http::assertNothingSent();
    }

    public function test_device_id_is_required(): void
    {
        Http::fake();
        $this->postJson('/api/trial', $this->payload(['device_id' => '']))
            ->assertStatus(422)->assertJsonValidationErrors('device_id');
        Http::assertNothingSent();
    }

    public function test_landing_offers_trial_only_when_fully_configured(): void
    {
        $this->get('/')->assertSee('<meta name="trial-enabled" content="1">', false);

        // Activada pero sin clave de DNI: la landing vuelve a WhatsApp y la API no crea nada.
        config(['services.dni.key' => null]);
        Http::fake();
        $this->get('/')->assertSee('<meta name="trial-enabled" content="0">', false);
        $this->postJson('/api/trial', $this->payload())->assertStatus(503);
        Http::assertNothingSent();
    }

    public function test_honeypot_blocks_bots(): void
    {
        Http::fake();

        $this->postJson('/api/trial', $this->payload(['website' => 'spam']))->assertStatus(422);
        Http::assertNothingSent();
    }
}
