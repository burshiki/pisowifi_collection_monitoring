import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PaginatedActivityLogs } from '@/types/activity-log';

interface ActivityLogDataTableProps {
  logs: PaginatedActivityLogs;
}

export function ActivityLogDataTable({ logs }: ActivityLogDataTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (logs.data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No activity logs found.</p>
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
                <th className="px-6 py-3 text-left text-sm font-medium">Date & Time</th>
                <th className="px-6 py-3 text-left text-sm font-medium">User</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Category</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Event</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Description</th>
                <th className="px-6 py-3 text-left text-sm font-medium">IP Address</th>
                <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.data.map((log) => (
                <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {log.user ? log.user.name : <span className="text-muted-foreground">System</span>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.log_name ? (
                      <Badge variant="outline">{log.log_name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.event ? (
                      <Badge className={getEventBadgeColor(log.event)}>
                        {log.event}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="max-w-md truncate">{log.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {log.ip_address || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/activity-logs/${log.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Controls */}
      {logs.last_page > 1 && (
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {logs.from} to {logs.to} of {logs.total} logs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={logs.current_page === 1}
                onClick={() => {
                  const currentUrl = new URL(window.location.href);
                  const params = Object.fromEntries(currentUrl.searchParams);
                  router.get('/activity-logs', { ...params, page: logs.current_page - 1 }, { preserveScroll: true, preserveState: true });
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {logs.current_page} of {logs.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={logs.current_page === logs.last_page}
                onClick={() => {
                  const currentUrl = new URL(window.location.href);
                  const params = Object.fromEntries(currentUrl.searchParams);
                  router.get('/activity-logs', { ...params, page: logs.current_page + 1 }, { preserveScroll: true, preserveState: true });
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
