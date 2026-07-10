<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Eliminación de datos de Fastnet Player">
    <title>Eliminación de datos | Fastnet Player</title>
    <style>
        html {
            background: #030712;
        }

        body {
            min-height: 100vh;
            margin: 0;
            background:
                radial-gradient(circle at top left, rgba(31, 111, 255, 0.24), transparent 34%),
                radial-gradient(circle at 85% 10%, rgba(14, 165, 233, 0.16), transparent 30%),
                linear-gradient(180deg, rgba(3, 7, 18, 0), rgba(3, 7, 18, 0.92) 62%),
                #030712;
            color: #ffffff;
            font-family: Manrope, "Segoe UI", system-ui, sans-serif;
        }

        .data-deletion-fallback {
            width: min(100% - 2rem, 56rem);
            margin: 0 auto;
            padding: 2rem 0;
        }

        .data-deletion-fallback a {
            color: #bae6fd;
        }
    </style>
    @vite(['resources/css/app.css'])
</head>
<body class="min-h-screen bg-fp-night text-white antialiased">
    <main class="relative isolate min-h-screen overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
        <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(31,111,255,0.24),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(180deg,rgba(3,7,18,0),rgba(3,7,18,0.92)_62%)]"></div>
        <div class="data-deletion-fallback mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col">
            <header class="border-b border-white/10 pb-8">
                <div>
                    <p class="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Fastnet Player</p>
                    <h1 class="text-4xl font-black tracking-tight text-white sm:text-5xl">Eliminación de datos</h1>
                    <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">Última actualización: 10 de julio de 2026</p>
                </div>
            </header>

            <article class="prose prose-invert mt-8 max-w-none rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-fp-soft backdrop-blur sm:p-8 lg:p-10">
                <h2 class="text-2xl font-black tracking-tight text-white">Eliminación de datos - Fastnet Player</h2>
                <p class="mt-2 text-sm font-semibold text-sky-200">Última actualización: 10 de julio de 2026</p>

                <p class="mt-6 text-base leading-8 text-slate-200">
                    Fastnet Player permite que los usuarios soliciten la suspensión de su cuenta o la eliminación de los datos asociados al uso de la aplicación.
                </p>

                <section class="mt-8">
                    <h3 class="text-xl font-bold text-white">Cómo solicitar la eliminación de datos</h3>
                    <p class="mt-3 text-base leading-8 text-slate-300">
                        El usuario puede solicitar la eliminación de sus datos mediante cualquiera de los siguientes canales:
                    </p>

                    <div class="mt-5 grid gap-4 sm:grid-cols-3">
                        <div class="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                            <p class="text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">Correo electrónico</p>
                            <a class="mt-2 block break-words text-base font-bold text-sky-100 hover:text-white" href="mailto:fastnetperu.developer@gmail.com">fastnetperu.developer@gmail.com</a>
                        </div>
                        <div class="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                            <p class="text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">Área de ventas</p>
                            <a class="mt-2 block text-base font-bold text-sky-100 hover:text-white" href="tel:+51942059874">942 059 874</a>
                        </div>
                        <div class="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                            <p class="text-sm font-semibold uppercase tracking-[0.16em] text-sky-300">Área de cobranza</p>
                            <a class="mt-2 block text-base font-bold text-sky-100 hover:text-white" href="tel:+51974968676">974 968 676</a>
                        </div>
                    </div>

                    <p class="mt-6 text-base leading-8 text-slate-300">
                        Para procesar la solicitud, el usuario debe indicar claramente que desea eliminar sus datos de Fastnet Player o suspender su cuenta. También debe proporcionar información que permita identificar la cuenta, como:
                    </p>
                    <ul class="mt-4 space-y-3 text-base leading-7 text-slate-300">
                        <li class="flex gap-3"><span class="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-sky-300"></span><span>Nombre completo.</span></li>
                        <li class="flex gap-3"><span class="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-sky-300"></span><span>Nombre de usuario.</span></li>
                        <li class="flex gap-3"><span class="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-sky-300"></span><span>Correo electrónico o número asociado a la cuenta, si corresponde.</span></li>
                        <li class="flex gap-3"><span class="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-sky-300"></span><span>Motivo de la solicitud, si desea indicarlo.</span></li>
                    </ul>
                </section>

                <section class="mt-8 space-y-7">
                    <div>
                        <h3 class="text-xl font-bold text-white">Proceso de atención</h3>
                        <p class="mt-3 text-base leading-8 text-slate-300">
                            Una vez recibida la solicitud, el equipo de Fastnet Player revisará la información enviada. Si la cuenta corresponde al usuario solicitante, se procederá con la suspensión, desactivación o eliminación de los datos asociados desde el panel de administración del servicio.
                        </p>
                    </div>

                    <div>
                        <h3 class="text-xl font-bold text-white">Datos que pueden eliminarse o desactivarse</h3>
                        <ul class="mt-4 space-y-3 text-base leading-7 text-slate-300">
                            <li class="flex gap-3"><span class="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-sky-300"></span><span>Cuenta de usuario asociada a Fastnet Player.</span></li>
                            <li class="flex gap-3"><span class="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-sky-300"></span><span>Credenciales o identificadores internos relacionados con el acceso.</span></li>
                            <li class="flex gap-3"><span class="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-sky-300"></span><span>Datos asociados al uso del servicio dentro de la aplicación.</span></li>
                            <li class="flex gap-3"><span class="mt-3 h-1.5 w-1.5 flex-none rounded-full bg-sky-300"></span><span>Información técnica relacionada con la cuenta, cuando corresponda.</span></li>
                        </ul>
                    </div>

                    <div>
                        <h3 class="text-xl font-bold text-white">Datos que pueden conservarse</h3>
                        <p class="mt-3 text-base leading-8 text-slate-300">
                            Fastnet Player puede conservar cierta información cuando sea necesaria por motivos legales, administrativos, de seguridad, prevención de abuso, soporte técnico o cumplimiento de obligaciones del servicio.
                        </p>
                    </div>

                    <div>
                        <h3 class="text-xl font-bold text-white">Plazo de atención</h3>
                        <p class="mt-3 text-base leading-8 text-slate-300">
                            Las solicitudes serán atendidas en un plazo estimado de hasta 15 días hábiles desde la recepción de la solicitud y validación de la información del usuario.
                        </p>
                    </div>

                    <div>
                        <h3 class="text-xl font-bold text-white">Contacto</h3>
                        <p class="mt-3 text-base leading-8 text-slate-300">
                            Fastnet Player<br>
                            Correo: <a class="font-bold text-sky-200 hover:text-sky-100" href="mailto:fastnetperu.developer@gmail.com">fastnetperu.developer@gmail.com</a><br>
                            Ventas: <a class="font-bold text-sky-200 hover:text-sky-100" href="tel:+51942059874">942 059 874</a><br>
                            Cobranza: <a class="font-bold text-sky-200 hover:text-sky-100" href="tel:+51974968676">974 968 676</a>
                        </p>
                    </div>
                </section>
            </article>
        </div>
    </main>
</body>
</html>
