import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, History, Printer, Search, X, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ConfirmCollectionDialog } from '@/components/audit/confirm-collection-dialog';
import { ViewHistoryDialog } from '@/components/audit/view-history-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import type { Auth } from '@/types/auth';
import type { WifiVendo } from '@/types/wifi-vendo';

interface PageProps {
  vendos: WifiVendo[];
  filters: {
    search?: string;
    status?: string;
    confirmation_date?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Audit Collections', href: '#' },
];

export default function AuditCollectionsPage({ vendos, filters }: PageProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const [selectedVendo, setSelectedVendo] = useState<WifiVendo | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyVendo, setHistoryVendo] = useState<WifiVendo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Filter states
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || 'all');
  const [confirmationDate, setConfirmationDate] = useState(filters.confirmation_date || '');

  const canConfirmCollection = auth.permissions?.includes('view audit collections');
  const isAdmin = auth.roles?.includes('admin');
  
  // Debounced search and filter (only send search and status to server)
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      router.get(
        '/audit-collections',
        {
          search: search || undefined,
          status: status !== 'all' ? status : undefined,
        },
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
    setConfirmationDate('');
    setCurrentPage(1);
  };

  const handleDateChange = (value: string) => {
    setConfirmationDate(value);
    setCurrentPage(1);
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const currentMonth = getCurrentMonth();

  const handleConfirmCollection = (vendo: WifiVendo, monthKey: string) => {
    setSelectedVendo(vendo);
    setSelectedMonth(monthKey);
    setIsConfirmOpen(true);
  };

  const handleViewHistory = (vendo: WifiVendo) => {
    setHistoryVendo(vendo);
    setIsHistoryOpen(true);
  };

  // Find the latest month with a collection for a vendo
  const getLatestCollectionMonth = (vendo: WifiVendo): string | null => {
    const collections = vendo.monthly_collections || {};
    const months = Object.keys(collections).sort().reverse();
    for (const month of months) {
      const data = collections[month];
      const amount = typeof data === 'object' ? data?.amount : data;
      if (amount && amount > 0) return month;
    }
    return null;
  };

  // Get all vendos with their collection data
  const vendoCollections = vendos.map((vendo) => {
    // Use the latest month with a collection, not just the current calendar month
    const auditMonthKey = getLatestCollectionMonth(vendo) ?? currentMonth;
    const monthData = vendo.monthly_collections?.[auditMonthKey];
    const currentCollection = typeof monthData === 'object' ? monthData?.amount : monthData;
    const collectionRemarks = typeof monthData === 'object' ? monthData?.remarks : null;
    const collectedAt = typeof monthData === 'object' ? monthData?.collected_at : null;
    const confirmedAmount = typeof monthData === 'object' ? monthData?.confirmed_amount : null;
    const confirmedAt = typeof monthData === 'object' ? monthData?.confirmed_at : null;
    const discrepancy = typeof monthData === 'object' ? monthData?.discrepancy : null;
    const isConfirmed = confirmedAmount !== null && confirmedAmount !== undefined;

    // Get all historical collections
    const allCollections = Object.entries(vendo.monthly_collections || {})
      .map(([monthKey, data]) => ({
        month: monthKey,
        amount: typeof data === 'object' ? data.amount : data,
        remarks: typeof data === 'object' ? data.remarks : null,
        confirmedAmount: typeof data === 'object' ? data.confirmed_amount : null,
        discrepancy: typeof data === 'object' ? data.discrepancy : null,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      ...vendo,
      auditMonthKey,
      currentCollection,
      collectionRemarks,
      collectedAt,
      confirmedAmount,
      confirmedAt,
      discrepancy,
      isConfirmed,
      allCollections,
      hasCurrentCollection: currentCollection && currentCollection > 0,
    };
  }).filter((vendo) => {
    // Filter by confirmation date on the frontend (uses browser timezone, consistent with displayed dates)
    if (!confirmationDate) return true;
    if (!vendo.confirmedAt) return false;
    const confirmedLocal = new Date(vendo.confirmedAt);
    const year = confirmedLocal.getFullYear();
    const month = String(confirmedLocal.getMonth() + 1).padStart(2, '0');
    const day = String(confirmedLocal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === confirmationDate;
  }).sort((a, b) => {
    // Sort by collection date in ascending order
    // Collections with no date go to the end
    if (!a.collectedAt && !b.collectedAt) return 0;
    if (!a.collectedAt) return 1;
    if (!b.collectedAt) return -1;
    return new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime();
  });

  const collectedVendos = vendoCollections.filter(v => v.hasCurrentCollection);
  const confirmedVendos = collectedVendos.filter(v => v.isConfirmed);
  const unconfirmedVendos = collectedVendos.filter(v => !v.isConfirmed);
  
  const totalDiscrepancy = confirmedVendos.reduce((sum, v) => sum + Math.abs(v.discrepancy || 0), 0);
  const totalConfirmedAmount = confirmedVendos.reduce((sum, v) => sum + (v.confirmedAmount || 0), 0);

  // Print report function
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const getCurrentMonthLabel = () => {
      const now = new Date();
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audit Collections Report - ${getCurrentMonthLabel()}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .amount {
              text-align: right;
            }
            .total-row {
              background-color: #f9f9f9;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Audit Collections Report</h1>
            <p>${getCurrentMonthLabel()}</p>
            <p>Generated on: ${currentDate}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Vendo Name</th>
                <th class="amount">Reported</th>
                <th class="amount">Confirmed</th>
                <th>Confirmed At</th>
                <th class="amount">Discrepancy</th>
              </tr>
            </thead>
            <tbody>
              ${confirmedVendos.map(vendo => `
                <tr>
                  <td>${vendo.name}</td>
                  <td class="amount">₱${vendo.currentCollection?.toLocaleString() || '0'}</td>
                  <td class="amount">₱${vendo.confirmedAmount?.toLocaleString() || '0'}</td>
                  <td>${vendo.confirmedAt ? new Date(vendo.confirmedAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}</td>
                  <td class="amount" style="color: ${vendo.discrepancy === 0 ? 'green' : 'red'}">
                    ${vendo.discrepancy === 0 ? '₱0' : '₱' + Math.abs(vendo.discrepancy || 0).toLocaleString()}
                  </td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">TOTAL CONFIRMED COLLECTIONS</td>
                <td class="amount">₱${totalConfirmedAmount.toLocaleString()}</td>
                <td class="amount" style="color: red">₱${totalDiscrepancy.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>PisoWiFi Collection Monitoring System</p>
            <p>This is an automatically generated report</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Pagination
  const totalPages = Math.ceil(vendoCollections.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedVendos = vendoCollections.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Audit Collections" />

      <div className="space-y-6 p-4 md:p-6">
        {/* Header with Print Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Audit Collections</h1>
            <p className="text-muted-foreground mt-2">
              Review and confirm monthly collections
            </p>
          </div>
          {confirmedVendos.length > 0 && (
            <Button onClick={handlePrintReport} size="lg" className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1 lg:max-w-sm">
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
          
          {/* Status Filter */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full lg:w-50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending Audit</SelectItem>
              <SelectItem value="not-collected">Not Collected</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              type="date"
              placeholder="Filter by confirmation date"
              value={confirmationDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="pl-9 pr-9 w-full lg:w-55"
            />
            {confirmationDate && (
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Vendos</div>
            <div className="text-3xl font-bold mt-2">{vendos.length}</div>
          </Card>
          <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">Collected</div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{collectedVendos.length}</div>
          </Card>
          <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Confirmed</div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{confirmedVendos.length}</div>
          </Card>
          <Card className="p-6 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Pending Audit</div>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">{unconfirmedVendos.length}</div>
          </Card>
          <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Confirmed Collections</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">₱{totalConfirmedAmount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
              <span className="font-medium">Total Discrepancy: </span>
              <span className="text-red-600 dark:text-red-400 font-semibold">₱{totalDiscrepancy.toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Collections Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-medium">Vendo Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Reported</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Confirmed</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Confirmed At</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Discrepancy</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVendos.map((vendo) => (
                  <tr key={vendo.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium">{vendo.name}</div>
                        {vendo.remarks && (
                          <div className="text-xs text-muted-foreground">{vendo.remarks}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {vendo.hasCurrentCollection ? (
                        <div>
                          <div className="font-medium text-green-600 dark:text-green-400">
                            ₱{vendo.currentCollection?.toLocaleString()}
                          </div>
                          {vendo.collectionRemarks && (
                            <div className="text-xs text-muted-foreground italic mt-1">
                              {vendo.collectionRemarks}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {vendo.isConfirmed ? (
                        <div className="font-medium text-purple-600 dark:text-purple-400">
                          ₱{vendo.confirmedAmount?.toLocaleString()}
                        </div>
                      ) : vendo.hasCurrentCollection ? (
                        <span className="text-orange-600 dark:text-orange-400 text-xs">Pending</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {vendo.confirmedAt ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(vendo.confirmedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(vendo.confirmedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {vendo.isConfirmed ? (
                        <div className={`font-medium ${
                          vendo.discrepancy === 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {vendo.discrepancy === 0 ? '✓ None' : `₱${Math.abs(vendo.discrepancy || 0).toLocaleString()}`}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {vendo.isConfirmed ? (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          Confirmed
                        </Badge>
                      ) : vendo.hasCurrentCollection ? (
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                          Pending Audit
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          Not Collected
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHistory(vendo)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <History className="h-4 w-4 mr-1" />
                          History
                        </Button>
                        {vendo.hasCurrentCollection && canConfirmCollection && (
                          // Show confirm button for not-yet-confirmed collections (both audit and admin)
                          // Show re-confirm button only for admin role
                          (!vendo.isConfirmed || isAdmin) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirmCollection(vendo, vendo.auditMonthKey)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              {vendo.isConfirmed ? 'Re-confirm' : 'Confirm'}
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, vendoCollections.length)} of {vendoCollections.length} vendos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const current = currentPage;
                    const last = totalPages;
                    const pages: (number | string)[] = [];
                    
                    if (last <= 7) {
                      // Show all pages if 7 or fewer
                      for (let i = 1; i <= last; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Always show first page
                      pages.push(1);
                      
                      // Show ellipsis and/or pages around current
                      if (current > 3) {
                        pages.push('...');
                      }
                      
                      // Show pages around current
                      for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
                        pages.push(i);
                      }
                      
                      // Show ellipsis before last page if needed
                      if (current < last - 2) {
                        pages.push('...');
                      }
                      
                      // Always show last page
                      pages.push(last);
                    }
                    
                    return pages.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        );
                      }
                      
                      const pageNumber = page as number;
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => goToPage(pageNumber)}
                          className="w-8"
                        >
                          {pageNumber}
                        </Button>
                      );
                    });
                  })()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <ConfirmCollectionDialog
        vendo={selectedVendo}
        monthKey={selectedMonth}
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
      />

      <ViewHistoryDialog
        vendo={historyVendo}
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
    </AppLayout>
  );
}
