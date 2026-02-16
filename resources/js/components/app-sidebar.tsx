import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Wifi, Users, FileCheck, ScrollText, Settings2 } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as usersIndex } from '@/routes/users';
import { index as wifiVendosIndex } from '@/routes/wifi-vendos';
import type { NavItem } from '@/types';
import type { Auth } from '@/types/auth';
import AppLogo from './app-logo';

const getMainNavItems = (permissions: string[]): NavItem[] => {
    const items: NavItem[] = [];

    // Dashboard - always visible to authenticated users
    if (permissions.includes('view dashboard')) {
        items.push({
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        });
    }

    // WiFi Vendos - visible if user can view vendos
    if (permissions.includes('view wifi vendos')) {
        items.push({
            title: 'WiFi Vendos',
            href: wifiVendosIndex(),
            icon: Wifi,
        });
    }

    // Audit Collections - visible if user can view audit collections
    if (permissions.includes('view audit collections')) {
        items.push({
            title: 'Audit Collections',
            href: '/audit-collections',
            icon: FileCheck,
        });
    }

    // Activity Logs - visible if user can view activity logs
    if (permissions.includes('view activity logs')) {
        items.push({
            title: 'Activity Logs',
            href: '/activity-logs',
            icon: ScrollText,
        });
    }

    // Users - visible if user can view users
    if (permissions.includes('view users')) {
        items.push({
            title: 'Users',
            href: usersIndex(),
            icon: Users,
        });
    }

    // Options - visible only to admins with manage system options permission
    if (permissions.includes('manage system options')) {
        items.push({
            title: 'Options',
            href: '/options',
            icon: Settings2,
        });
    }

    return items;
};

const footerNavItems: NavItem[] = [
    
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const mainNavItems = getMainNavItems(auth.permissions || []);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
