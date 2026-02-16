import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            systemSettings: {
                name: string;
                logo: string | null;
            };
            flash: {
                success?: string;
                error?: string;
            };
            [key: string]: unknown;
        };
    }
}
