import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';

function applyDynamicFavicon(props: Record<string, unknown>) {
    const systemSettings = props.systemSettings as { logo?: string; name?: string } | undefined;
    const logo = systemSettings?.logo;
    let link = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.id = 'dynamic-favicon';
        document.head.appendChild(link);
    }
    if (logo) {
        link.href = `/storage/${logo}`;
        link.type = 'image/png';
    } else {
        link.href = '/favicon.ico';
        link.removeAttribute('type');
    }
}

createInertiaApp({
    title: (title) => {
        const appName = import.meta.env.VITE_APP_NAME || 'PisoWiFi Collection Monitoring';
        return title ? `${title} - ${appName}` : appName;
    },
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
                <Toaster position="top-right" />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// Update favicon dynamically from systemSettings on every Inertia navigation
router.on('navigate', (event) => {
    applyDynamicFavicon(event.detail.page.props as Record<string, unknown>);
});

// This will set light / dark mode on load...
initializeTheme();
