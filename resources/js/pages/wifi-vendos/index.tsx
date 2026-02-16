import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Search, X, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateVendoDialog } from '@/components/wifi-vendos/create-vendo-dialog';
import { VendoDataTable } from '@/components/wifi-vendos/vendo-data-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedVendos } from '@/types/wifi-vendo';
import type { Auth } from '@/types/auth';

interface PageProps {
  vendos: PaginatedVendos;
  filters: {
    search?: string;
    status?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'WiFi Vendos', href: '#' },
];

export default function WifiVendosPage({ vendos, filters }: PageProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || 'all');
  const [collectionDate, setCollectionDate] = useState('');

  const canCreate = auth.permissions?.includes('create wifi vendos');

  useEffect(() => {
    const timer = setTimeout(() => {
      router.get(
        '/wifi-vendos',
        { search: search || undefined, status: status !== 'all' ? status : undefined },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
        }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status]);

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleClearDate = () => {
    setCollectionDate('');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="WiFi Vendo Collection Monitoring" />

      <div className="space-y-6 p-4 md:p-6">
        {/* Mobile-Friendly Search, Filter, and Add Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          {/* Search and Filter Container */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search vendo by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Filter Dropdown */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="not-collected">Not Collected</SelectItem>
                <SelectItem value="new">New Vendo</SelectItem>
              </SelectContent>
            </Select>
            {/* Collection Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <Input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="pl-9 pr-9 w-full sm:w-52"
              />
              {collectionDate && (
                <button
                  type="button"
                  onClick={handleClearDate}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {/* Add Button */}
          {canCreate && (
            <Button onClick={() => setIsCreateOpen(true)} size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add WiFi Vendo
            </Button>
          )}
        </div>

        <VendoDataTable vendos={vendos} filters={filters} collectionDate={collectionDate} />

        <CreateVendoDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    </AppLayout>
  );
}
