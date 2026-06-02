<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fastnet Login</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-[#070B12] text-[#F4F7FB] flex items-center justify-center p-4">
    <form method="POST" action="{{ route('portal.login.submit') }}" class="w-full max-w-md bg-[#0E1420] border border-white/10 rounded-2xl p-6 space-y-4">
        @csrf
        <h1 class="text-2xl font-bold">Ingresar a Fastnet</h1>
        <p class="text-sm text-[#8A93A3]">Conecta con tu servidor IPTV para ver canales, peliculas y series.</p>

        @if ($errors->has('credentials'))
            <div class="text-sm text-red-400">{{ $errors->first('credentials') }}</div>
        @endif

        <div>
            <label class="text-sm">Servidor</label>
            <input name="server_url" type="url" value="{{ old('server_url', $serverUrl) }}" required class="mt-1 w-full rounded-xl bg-[#111827] border border-white/10 px-3 py-2">
        </div>
        <div>
            <label class="text-sm">Usuario</label>
            <input name="username" value="{{ old('username') }}" required class="mt-1 w-full rounded-xl bg-[#111827] border border-white/10 px-3 py-2">
        </div>
        <div>
            <label class="text-sm">Contrasena</label>
            <input name="password" type="password" required class="mt-1 w-full rounded-xl bg-[#111827] border border-white/10 px-3 py-2">
        </div>
        <button class="w-full rounded-xl bg-[#4C6FFF] hover:bg-[#5D7FFF] py-2 font-medium">Iniciar sesion</button>
    </form>
</body>
</html>

