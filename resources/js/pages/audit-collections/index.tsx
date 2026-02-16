import { Head, usePage } from '@inertiajs/react';
import { CheckCircle2, History, Printer } from 'lucide-react';
import { useState } from 'react';
import { ConfirmCollectionDialog } from '@/components/audit/confirm-collection-dialog';
import { ViewHistoryDialog } from '@/components/audit/view-history-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Auth } from '@/types/auth';
import type { WifiVendo } from '@/types/wifi-vendo';

interface PageProps {
  vendos: WifiVendo[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Audit Collections', href: '#' },
];

export default function AuditCollectionsPage({ vendos }: PageProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const [selectedVendo, setSelectedVendo] = useState<WifiVendo | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyVendo, setHistoryVendo] = useState<WifiVendo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const canConfirmCollection = auth.permissions?.includes('view audit collections');

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

  // Get all vendos with their collection data
  const vendoCollections = vendos.map((vendo) => {
    const monthData = vendo.monthly_collections?.[currentMonth];
    const currentCollection = typeof monthData === 'object' ? monthData?.amount : monthData;
    const collectionRemarks = typeof monthData === 'object' ? monthData?.remarks : null;
    const confirmedAmount = typeof monthData === 'object' ? monthData?.confirmed_amount : null;
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
      currentCollection,
      collectionRemarks,
      confirmedAmount,
      discrepancy,
      isConfirmed,
      allCollections,
      hasCurrentCollection: currentCollection && currentCollection > 0,
    };
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
                <th class="amount">Discrepancy</th>
              </tr>
            </thead>
            <tbody>
              ${confirmedVendos.map(vendo => `
                <tr>
                  <td>${vendo.name}</td>
                  <td class="amount">₱${vendo.currentCollection?.toLocaleString() || '0'}</td>
                  <td class="amount">₱${vendo.confirmedAmount?.toLocaleString() || '0'}</td>
                  <td class="amount" style="color: ${vendo.discrepancy === 0 ? 'green' : 'red'}">
                    ${vendo.discrepancy === 0 ? '₱0' : '₱' + Math.abs(vendo.discrepancy || 0).toLocaleString()}
                  </td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">TOTAL CONFIRMED COLLECTIONS</td>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmCollection(vendo, currentMonth)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {vendo.isConfirmed ? 'Re-confirm' : 'Confirm'}
                          </Button>
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  ))}
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
