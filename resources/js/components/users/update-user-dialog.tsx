import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { update } from '@/routes/users';
import type { User, Role, Permission } from '@/types/user';

interface UpdateUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  permissions: Record<string, Permission[]>;
}

export function UpdateUserDialog({ user, open, onOpenChange, roles, permissions }: UpdateUserDialogProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
    roles: user.roles?.map(r => r.name) || [],
    permissions: user.permissions?.map(p => p.name) || [],
  });

  useEffect(() => {
    if (open && user) {
      setData({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: user.roles?.map(r => r.name) || [],
        permissions: user.permissions?.map(p => p.name) || [],
      });
    }
  }, [open, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    put(update(user.id).url, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('User updated successfully!');
        onOpenChange(false);
      },
      onError: () => {
        toast.error('Failed to update user');
      },
    });
  };

  const handleRoleChange = (roleName: string, checked: boolean) => {
    if (checked) {
      setData('roles', [...data.roles, roleName]);
    } else {
      setData('roles', data.roles.filter(r => r !== roleName));
    }
  };

  const handlePermissionChange = (permissionName: string, checked: boolean) => {
    if (checked) {
      setData('permissions', [...data.permissions, permissionName]);
    } else {
      setData('permissions', data.permissions.filter(p => p !== permissionName));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and manage roles and permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Enter user name"
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">New Password (optional)</Label>
            <Input
              id="edit-password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Leave blank to keep current password"
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
          </div>

          {data.password && (
            <div className="space-y-2">
              <Label htmlFor="edit-password_confirmation">Confirm New Password</Label>
              <Input
                id="edit-password_confirmation"
                type="password"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-role-${role.id}`}
                    checked={data.roles.includes(role.name)}
                    onCheckedChange={(checked) => handleRoleChange(role.name, checked as boolean)}
                  />
                  <label htmlFor={`edit-role-${role.id}`} className="text-sm font-medium capitalize">
                    {role.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
