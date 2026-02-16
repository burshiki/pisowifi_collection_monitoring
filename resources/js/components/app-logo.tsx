import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { systemSettings } = usePage().props;
    const logoUrl = systemSettings?.logo ? `/storage/${systemSettings.logo}` : null;
    const systemName = systemSettings?.name || 'PisoWiFi Collection Monitoring';

    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                {logoUrl ? (
                    <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="size-8 rounded-md object-cover"
                    />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {systemName}
                </span>
            </div>
        </>
    );
}
