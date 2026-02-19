<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- PWA meta tags --}}
        <meta name="theme-color" content="#2563eb">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="VendoCollect">
        <link rel="manifest" href="/manifest.json">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @php
            $systemLogo = \App\Models\SystemSetting::get('system_logo');
            $faviconUrl = $systemLogo ? asset('storage/' . $systemLogo) : null;
        @endphp
        @if($faviconUrl)
            <link rel="icon" id="dynamic-favicon" href="{{ $faviconUrl }}" type="image/png">
            <link rel="apple-touch-icon" id="dynamic-apple-icon" href="{{ $faviconUrl }}">
        @else
            <link rel="icon" id="dynamic-favicon" href="/favicon.ico" sizes="any">
            <link rel="icon" href="/favicon.svg" type="image/svg+xml">
            <link rel="apple-touch-icon" id="dynamic-apple-icon" href="/apple-touch-icon.png">
        @endif

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>

    {{-- PWA Service Worker Registration --}}
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function (registration) {
                        console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch(function (error) {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }

        // Dynamically update favicon from Inertia shared systemSettings on SPA navigation
        document.addEventListener('inertia:navigate', function () {
            try {
                const page = window.__inertia_page__ || (window._inertia && window._inertia.page);
                const logo = page && page.props && page.props.systemSettings && page.props.systemSettings.logo;
                if (logo) {
                    const url = '/storage/' + logo;
                    const el = document.getElementById('dynamic-favicon');
                    if (el) el.setAttribute('href', url);
                }
            } catch (e) {}
        });
    </script>
</html>
