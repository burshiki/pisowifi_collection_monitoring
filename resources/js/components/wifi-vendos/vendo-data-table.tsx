import { router, usePage } from '@inertiajs/react';
import { Trash2, Edit, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { destroy } from '@/routes/wifi-vendos';
import type { Auth } from '@/types/auth';
import type { WifiVendo, PaginatedVendos } from '@/types/wifi-vendo';
import { AddCollectionDialog } from './add-collection-dialog';
import { UpdateVendoDialog } from './update-vendo-dialog';

interface VendoDataTableProps {
  vendos: PaginatedVendos;
  filters?: {
    search?: string;
    status?: string;
  };
  collectionDate?: string;
}

export function VendoDataTable({ vendos, filters, collectionDate }: VendoDataTableProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const [selectedVendo, setSelectedVendo] = useState<WifiVendo | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false);

  const canAddCollection = auth.permissions?.includes('add wifi vendo collections');
  const canUpdate = auth.permissions?.includes('update wifi vendos');
  const canDelete = auth.permissions?.includes('delete wifi vendos');

  // Update selectedVendo when vendos data changes (after Inertia reload)
  useEffect(() => {
    if (selectedVendo) {
      const updatedVendo = vendos.data.find(v => v.id === selectedVendo.id);
      if (updatedVendo && JSON.stringify(updatedVendo) !== JSON.stringify(selectedVendo)) {
        setSelectedVendo(updatedVendo);
      }
    }
  }, [vendos, selectedVendo]);

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getCurrentMonthLabel = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isNewVendo = (vendo: WifiVendo) => {
    const createdDate = new Date(vendo.created_at);
    const now = new Date();
    return createdDate.getFullYear() === now.getFullYear() && 
           createdDate.getMonth() === now.getMonth();
  };

  const handleDelete = (vendo: WifiVendo) => {
    if (window.confirm(`Are you sure you want to delete "${vendo.name}"?`)) {
      router.delete(destroy(vendo.id), {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('WiFi Vendo deleted successfully!');
        },
        onError: () => {
          toast.error('Failed to delete WiFi Vendo');
        },
      });
    }
  };

  const handleEdit = (vendo: WifiVendo) => {
    setSelectedVendo(vendo);
    setIsEditOpen(true);
  };

  const handleAddCollection = (vendo: WifiVendo) => {
    setSelectedVendo(vendo);
    setIsAddCollectionOpen(true);
  };

  const currentMonth = getCurrentMonth();

  // Filter vendos by collection date (client-side, uses browser timezone for correct display match)
  const filteredVendos = collectionDate
    ? vendos.data.filter((vendo) => {
        const monthData = vendo.monthly_collections?.[currentMonth];
        const collectedAt = typeof monthData === 'object' ? monthData?.collected_at : null;
        if (!collectedAt) return false;
        const d = new Date(collectedAt);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}` === collectionDate;
      })
    : vendos.data;

  if (!collectionDate && vendos.data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No WiFi vendos yet. Create one to start monitoring.</p>
      </Card>
    );
  }

  if (collectionDate && filteredVendos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No collections found for the selected date.</p>
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
                <th className="px-6 py-3 text-left text-sm font-medium">
                  Vendo Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium">Remarks</th>
                <th className="px-6 py-3 text-left text-sm font-medium">{getCurrentMonthLabel()}</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Collection Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Collection Remarks</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendos.map((vendo) => {
                const monthData = vendo.monthly_collections?.[currentMonth];
                const currentCollection = typeof monthData === 'object' ? monthData?.amount : monthData;
                const collectionRemarks = typeof monthData === 'object' ? monthData?.remarks : null;
                const collectedAt = typeof monthData === 'object' ? monthData?.collected_at : null;
                const hasCollection = currentCollection && currentCollection > 0;
                const isNew = isNewVendo(vendo);

                return (
                  <tr key={vendo.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{vendo.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {vendo.remarks || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {hasCollection ? `₱${currentCollection.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {collectedAt ? (
                        <div>
                          <div className="font-medium text-foreground">
                            {new Date(collectedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-xs">
                            {new Date(collectedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : hasCollection ? (
                        <span className="text-xs text-muted-foreground">No date recorded</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground italic">
                      {collectionRemarks || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {hasCollection ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Collected
                        </Badge>
                      ) : isNew ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          New Vendo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          Not Collected
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canAddCollection && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddCollection(vendo)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vendo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(vendo)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Controls */}
      {vendos.last_page > 1 && (
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {vendos.from} to {vendos.to} of {vendos.total} vendos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={vendos.current_page === 1}
                onClick={() => router.get('/wifi-vendos', { page: vendos.current_page - 1, search: filters?.search, status: filters?.status }, { preserveScroll: true, preserveState: true })}
                className="h-9 px-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const current = vendos.current_page;
                  const last = vendos.last_page;
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
                        variant={vendos.current_page === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => router.get('/wifi-vendos', { page: pageNumber, search: filters?.search, status: filters?.status }, { preserveScroll: true, preserveState: true })}
                        className="h-9 w-9 p-0"
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
                disabled={vendos.current_page === vendos.last_page}
                onClick={() => router.get('/wifi-vendos', { page: vendos.current_page + 1, search: filters?.search, status: filters?.status }, { preserveScroll: true, preserveState: true })}
                className="h-9 px-4"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedVendo && (
        <>
          <UpdateVendoDialog
            vendo={selectedVendo}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
          <AddCollectionDialog
            vendo={selectedVendo}
            open={isAddCollectionOpen}
            onOpenChange={setIsAddCollectionOpen}
          />
        </>
      )}
    </>
  );
}
