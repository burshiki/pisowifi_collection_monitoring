import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ActivityLog } from '@/types/activity-log';

interface PageProps {
  log: ActivityLog;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Activity Logs', href: '/activity-logs' },
  { title: 'Log Details', href: '#' },
];

export default function ActivityLogShow({ log }: PageProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEventBadgeColor = (event: string | null) => {
    if (!event) return 'default';
    
    switch (event.toLowerCase()) {
      case 'created':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'updated':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'deleted':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'login':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'logout':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'failed_login':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default:
        return 'default';
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Activity Log Details" />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity Log Details</h1>
            <p className="text-muted-foreground mt-2">
              Detailed information about this activity
            </p>
          </div>
          <Link href="/activity-logs">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Logs
            </Button>
          </Link>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                <p className="mt-1 text-sm font-medium">{formatDate(log.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User</label>
                <p className="mt-1 text-sm font-medium">
                  {log.user ? log.user.name : <span className="text-muted-foreground">System</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <div className="mt-1">
                  {log.log_name ? (
                    <Badge variant="outline">{log.log_name}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Event</label>
                <div className="mt-1">
                  {log.event ? (
                    <Badge className={getEventBadgeColor(log.event)}>{log.event}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1 text-sm">{log.description}</p>
            </div>

            {/* Subject */}
            {log.subject_type && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <p className="mt-1 text-sm">
                  {log.subject_type} (ID: {log.subject_id})
                </p>
              </div>
            )}

            {/* Properties */}
            {log.properties && Object.keys(log.properties).length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Additional Details</label>
                <Card className="mt-2 p-4 bg-muted/30">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(log.properties, null, 2)}
                  </pre>
                </Card>
              </div>
            )}

            {/* Technical Information */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-4">Technical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <p className="mt-1 text-sm font-mono">{log.ip_address || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Log ID</label>
                  <p className="mt-1 text-sm font-mono">{log.id}</p>
                </div>
              </div>
              {log.user_agent && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                  <p className="mt-1 text-xs font-mono bg-muted/30 p-2 rounded break-all">
                    {log.user_agent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
