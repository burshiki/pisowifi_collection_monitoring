import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { WifiVendo } from '@/types/wifi-vendo';
import { dashboard } from '@/routes';
import { index as wifiVendosIndex } from '@/routes/wifi-vendos';
import { Button } from '@/components/ui/button';
import { Wifi, ArrowRight } from 'lucide-react';

interface PageProps {
  vendos: WifiVendo[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({ vendos }: PageProps) {
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const getCurrentMonthLabel = () => {
        const now = new Date();
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const isNewVendo = (vendo: WifiVendo) => {
        const createdDate = new Date(vendo.created_at);
        const now = new Date();
        return createdDate.getFullYear() === now.getFullYear() && 
               createdDate.getMonth() === now.getMonth();
    };

    const currentMonth = getCurrentMonth();
    const notCollectedVendos = vendos.filter((vendo) => {
        const monthData = vendo.monthly_collections?.[currentMonth];
        const amount = typeof monthData === 'object' ? monthData?.amount : monthData;
        return !amount || amount === 0;
    });
    const collectedVendos = vendos.filter((vendo) => {
        const monthData = vendo.monthly_collections?.[currentMonth];
        const amount = typeof monthData === 'object' ? monthData?.amount : monthData;
        return amount && amount > 0;
    });
    
    const newVendos = notCollectedVendos.filter(vendo => isNewVendo(vendo));
    const missedCollectionVendos = notCollectedVendos.filter(vendo => !isNewVendo(vendo));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        WiFi vendo collection monitoring overview
                    </p>
                </div>

                {/* Collection Status Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Vendos</div>
                                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{vendos.length}</div>
                            </div>
                            <Wifi className="h-8 w-8 text-blue-500 opacity-80" />
                        </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-green-600 dark:text-green-400">Collected</div>
                                <div className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{collectedVendos.length}</div>
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1">{getCurrentMonthLabel()}</div>
                            </div>
                            <div className="text-2xl">✅</div>
                        </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-red-600 dark:text-red-400">Not Collected</div>
                                <div className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">{notCollectedVendos.length}</div>
                                <div className="text-xs text-red-600 dark:text-red-400 mt-1">{getCurrentMonthLabel()}</div>
                            </div>
                            <div className="text-2xl">⚠️</div>
                        </div>
                    </div>
                </div>

                {/* Not Collected Vendos Alert */}
                {missedCollectionVendos.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3 text-lg">
                            ⚠️ Vendos Not Yet Collected This Month
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {missedCollectionVendos.map((vendo) => (
                                <span
                                    key={vendo.id}
                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
                                >
                                    {vendo.name}
                                </span>
                            ))}
                        </div>
                        <Link href={wifiVendosIndex().url}>
                            <Button variant="outline" size="sm" className="text-red-700 border-red-300 hover:bg-red-100">
                                Manage Collections
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                )}

                {/* New Vendos This Month */}
                {newVendos.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-lg">
                            🆕 New Vendos Added This Month
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {newVendos.map((vendo) => (
                                <span
                                    key={vendo.id}
                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                                >
                                    {vendo.name}
                                    <span className="ml-1.5 text-xs opacity-75">(New)</span>
                                </span>
                            ))}
                        </div>
                        <Link href={wifiVendosIndex().url}>
                            <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                                View All Vendos
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                )}

                {vendos.length === 0 && (
                    <div className="bg-muted/50 border border-dashed rounded-lg p-12 text-center">
                        <Wifi className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No WiFi Vendos Yet</h3>
                        <p className="text-muted-foreground mb-4">Start by adding your first WiFi vendo to track collections</p>
                        <Link href={wifiVendosIndex().url}>
                            <Button>
                                Add WiFi Vendo
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
