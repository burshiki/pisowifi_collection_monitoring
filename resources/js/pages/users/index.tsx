import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { UserDataTable } from '@/components/users/user-data-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedUsers, Role, Permission } from '@/types/user';
import type { Auth } from '@/types/auth';

interface PageProps {
  users: PaginatedUsers;
  roles: Role[];
  permissions: Record<string, Permission[]>;
  filters: {
    search?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Users', href: '#' },
];

export default function UsersPage({ users, roles, permissions, filters }: PageProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState(filters.search || '');

  const canCreate = auth.permissions?.includes('create users');

  useEffect(() => {
    const timer = setTimeout(() => {
      router.get(
        '/users',
        { search: search || undefined },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
        }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleClearSearch = () => {
    setSearch('');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
   <Head title="User Management" />

      <div className="space-y-6 p-4 md:p-6">
        {/* Mobile-Friendly Search and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search user by name or email..."
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
          {canCreate && (
            <Button onClick={() => setIsCreateOpen(true)} size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>

        <UserDataTable users={users} roles={roles} permissions={permissions} />

        <CreateUserDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
          roles={roles}
          permissions={permissions}
        />
      </div>
    </AppLayout>
  );
}
