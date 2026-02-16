import { Trash2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { User, PaginatedUsers, Role, Permission } from '@/types/user';
import type { Auth } from '@/types/auth';
import { UpdateUserDialog } from './update-user-dialog';
import { destroy } from '@/routes/users';

interface UserDataTableProps {
  users: PaginatedUsers;
  roles: Role[];
  permissions: Record<string, Permission[]>;
}

export function UserDataTable({ users, roles, permissions }: UserDataTableProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const canEdit = auth.permissions?.includes('edit users');
  const canDelete = auth.permissions?.includes('delete users');

  useEffect(() => {
    if (selectedUser) {
      const updatedUser = users.data.find(u => u.id === selectedUser.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(selectedUser)) {
        setSelectedUser(updatedUser);
      }
    }
  }, [users, selectedUser]);

  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete "${user.name}"?`)) {
      router.delete(destroy(user.id), {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('User deleted successfully!');
        },
        onError: (errors: any) => {
          const errorMessage = errors?.message || 'Failed to delete user';
          toast.error(errorMessage);
        },
      });
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  if (users.data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No users yet.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Roles</th>
                <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role.id} variant="secondary" className="text-xs">
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedUser && (
        <UpdateUserDialog
          user={selectedUser}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          roles={roles}
          permissions={permissions}
        />
      )}
    </>
  );
}
