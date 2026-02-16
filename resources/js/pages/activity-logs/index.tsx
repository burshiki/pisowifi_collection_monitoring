import { Head, router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedActivityLogs, ActivityLogFilters } from '@/types/activity-log';
import { ActivityLogDataTable } from '@/components/activity-logs/activity-log-data-table';

interface PageProps {
  logs: PaginatedActivityLogs;
  filters: ActivityLogFilters;
  logNames: string[];
  events: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Activity Logs', href: '#' },
];

export default function ActivityLogsPage({ logs, filters, logNames, events }: PageProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [logName, setLogName] = useState(filters.log_name || '');
  const [event, setEvent] = useState(filters.event || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      router.get(
        '/activity-logs',
        {
          search: search || undefined,
          log_name: logName || undefined,
          event: event || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
        }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [search, logName, event, dateFrom, dateTo]);

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleClearFilters = () => {
    setSearch('');
    setLogName('');
    setEvent('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || logName || event || dateFrom || dateTo;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Activity Logs" />

      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor all system activities and user actions
          </p>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by description..."
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={logName} onValueChange={setLogName}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Categories</SelectItem>
                {logNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={event} onValueChange={setEvent}>
              <SelectTrigger>
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Events</SelectItem>
                {events.map((evt) => (
                  <SelectItem key={evt} value={evt}>
                    {evt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        <ActivityLogDataTable logs={logs} />
      </div>
    </AppLayout>
  );
}
