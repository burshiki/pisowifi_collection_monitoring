import { Head, router, useForm } from '@inertiajs/react';
import { Database, Download, Upload, Save, Settings, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface PageProps {
  settings: {
    system_name: string;
    system_logo: string | null;
  };
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Options', href: '#' },
];

export default function OptionsPage({ settings, flash }: PageProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const { data, setData, processing } = useForm({
    system_name: settings.system_name,
    system_logo: null as File | null,
  });

  // Show flash messages
  useEffect(() => {
    if (flash?.success && typeof flash.success === 'string') {
      console.log('Flash success:', flash.success);
      toast.success(flash.success);
    }
    if (flash?.error) {
      console.log('Flash error:', flash.error, 'Type:', typeof flash.error);
      // Ensure error is a string
      const errorMessage = typeof flash.error === 'string' 
        ? flash.error 
        : JSON.stringify(flash.error);
      toast.error(errorMessage);
    }
  }, [flash]);

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('system_name', data.system_name);
    if (data.system_logo) {
      formData.append('system_logo', data.system_logo);
    }

    router.post('/options/settings', formData, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Settings updated successfully!');
        setData('system_logo', null);
        if (logoFileRef.current) logoFileRef.current.value = '';
      },
      onError: () => {
        toast.error('Failed to update settings');
      },
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setData('system_logo', e.target.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    if (confirm('Are you sure you want to remove the system logo?')) {
      router.delete('/options/logo', {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Logo removed successfully!');
        },
        onError: () => {
          toast.error('Failed to remove logo');
        },
      });
    }
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    window.location.href = '/options/backup';
    setTimeout(() => {
      setIsBackingUp(false);
      toast.success('Backup created successfully!');
    }, 2000);
  };

  const handleRestore = () => {
    restoreFileRef.current?.click();
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('WARNING: This will replace your current database. Are you sure you want to continue?')) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    
    const formData = new FormData();
    formData.append('backup_file', file);

    router.post('/options/restore', formData, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Database restored successfully! Reloading page...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      },
      onError: (errors) => {
        setIsRestoring(false);
        e.target.value = '';
        
        // Log errors for debugging
        console.error('Restore errors:', errors);
        
        // Handle validation errors
        if (errors.backup_file) {
          const errorMsg = Array.isArray(errors.backup_file) 
            ? errors.backup_file[0] 
            : String(errors.backup_file);
          toast.error(errorMsg);
        } else {
          // Generic error
          toast.error('Failed to restore database. Please check the file and try again.');
        }
      },
      onFinish: () => {
        // Don't reset state on success, let reload handle it
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="System Options" />

      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System Options</h1>
          <p className="text-muted-foreground mt-2">
            Manage system settings, backup and restore database
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Backup & Restore */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Database className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Database Management</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Backup and restore your database to prevent data loss
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isBackingUp ? 'Creating Backup...' : 'Backup Database'}
                </Button>

                <Button
                  onClick={handleRestore}
                  disabled={isRestoring}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isRestoring ? 'Restoring Database...' : 'Restore Database'}
                </Button>
                <input
                  ref={restoreFileRef}
                  type="file"
                  accept=".sql,.sqlite"
                  className="hidden"
                  onChange={handleRestoreFileChange}
                />
                
                {isRestoring && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      Please wait... Restoring database. This may take a moment.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Important:</strong> Restoring a database will replace all current data. 
                  Make sure to backup your current database before restoring.
                </p>
              </div>
            </div>
          </Card>

          {/* System Customization */}
          <Card className="p-6">
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">System Customization</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customize your system name and logo
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="system_name">System Name</Label>
                  <Input
                    id="system_name"
                    type="text"
                    value={data.system_name}
                    onChange={(e) => setData('system_name', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>System Logo</Label>
                  {settings.system_logo && (
                    <div className="mt-2 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={`/storage/${settings.system_logo}`}
                            alt="System Logo"
                            className="h-12 w-12 object-contain"
                          />
                          <span className="text-sm text-muted-foreground">Current Logo</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    <Input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a new logo (PNG, JPG, max 2MB)
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={processing}
                className="w-full"
                size="lg"
              >
                <Save className="mr-2 h-4 w-4" />
                {processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
