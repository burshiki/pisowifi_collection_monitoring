import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { WifiVendo } from '@/types/wifi-vendo';

interface ViewHistoryDialogProps {
  vendo: WifiVendo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewHistoryDialog({ vendo, open, onOpenChange }: ViewHistoryDialogProps) {
  if (!vendo) return null;

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get all historical collections
  const allCollections = Object.entries(vendo.monthly_collections || {})
    .map(([monthKey, data]) => ({
      month: monthKey,
      amount: typeof data === 'object' ? data.amount : data,
      remarks: typeof data === 'object' ? data.remarks : null,
      confirmedAmount: typeof data === 'object' ? data.confirmed_amount : null,
      discrepancy: typeof data === 'object' ? data.discrepancy : null,
      confirmedAt: typeof data === 'object' ? data.confirmed_at : null,
      auditorRemarks: typeof data === 'object' ? data.auditor_remarks : null,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Collection History - {vendo.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {allCollections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No collection history found
            </div>
          ) : (
            <div className="space-y-3">
              {allCollections.map((collection) => (
                <div
                  key={collection.month}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-base">
                      {formatMonthLabel(collection.month)}
                    </div>
                    {collection.confirmedAmount !== null && collection.confirmedAmount !== undefined ? (
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        Confirmed
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                        Pending Audit
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Reported Amount */}
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Reported Amount</div>
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        ₱{collection.amount?.toLocaleString() || 0}
                      </div>
                      {collection.remarks && (
                        <div className="text-xs text-muted-foreground italic mt-1">
                          {collection.remarks}
                        </div>
                      )}
                    </div>

                    {/* Confirmed Amount */}
                    {collection.confirmedAmount !== null && collection.confirmedAmount !== undefined && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Confirmed Amount</div>
                        <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                          ₱{collection.confirmedAmount.toLocaleString()}
                        </div>
                        {collection.confirmedAt && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(collection.confirmedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Discrepancy */}
                  {collection.confirmedAmount !== null && collection.confirmedAmount !== undefined && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Discrepancy:</span>
                        <span
                          className={`text-sm font-semibold ${
                            collection.discrepancy === 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {collection.discrepancy === 0 ? (
                            '✓ No Discrepancy'
                          ) : (
                            <>
                              {collection.discrepancy && collection.discrepancy > 0 ? '-' : '+'}
                              ₱
                              {Math.abs(collection.discrepancy || 0).toLocaleString()}
                            </>
                          )}
                        </span>
                      </div>
                      {collection.auditorRemarks && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <div className="font-medium mb-1">Auditor Remarks:</div>
                          <div className="text-muted-foreground">{collection.auditorRemarks}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
