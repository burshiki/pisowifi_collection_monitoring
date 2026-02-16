import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/wifi-vendos';
import type { WifiVendo } from '@/types/wifi-vendo';

interface ConfirmCollectionDialogProps {
  vendo: WifiVendo | null;
  monthKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmCollectionDialog({ 
  vendo, 
  monthKey,
  open, 
  onOpenChange 
}: ConfirmCollectionDialogProps) {
  const [confirmedAmount, setConfirmedAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendo) return;

    if (!confirmedAmount) {
      toast.error('Please enter confirmed amount');
      return;
    }

    const numConfirmedAmount = parseInt(confirmedAmount);
    if (isNaN(numConfirmedAmount) || numConfirmedAmount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const monthData = vendo.monthly_collections?.[monthKey];
    const collectorAmount = typeof monthData === 'object' ? monthData.amount : monthData;
    const discrepancy = collectorAmount - numConfirmedAmount;

    const updatedCollections = {
      ...vendo.monthly_collections,
      [monthKey]: {
        ...(typeof monthData === 'object' ? monthData : { amount: monthData, remarks: null }),
        confirmed_amount: numConfirmedAmount,
        confirmed_at: new Date().toISOString(),
        discrepancy: discrepancy,
        auditor_remarks: remarks || null,
      },
    };

    setProcessing(true);
    router.put(update(vendo.id).url, {
      name: vendo.name,
      remarks: vendo.remarks,
      // @ts-expect-error - Inertia handles nested objects correctly despite type definition
      monthly_collections: updatedCollections,
    }, {
      preserveScroll: true,
      onFinish: () => {
        setProcessing(false);
      },
      onSuccess: () => {
        toast.success('Collection confirmed successfully!');
        setConfirmedAmount('');
        setRemarks('');
        onOpenChange(false);
      },
      onError: (errors) => {
        toast.error('Failed to confirm collection');
        console.error(errors);
      },
    });
  };

  if (!vendo) return null;

  const monthData = vendo.monthly_collections?.[monthKey];
  const collectorAmount = typeof monthData === 'object' ? monthData.amount : monthData;
  const existingConfirmedAmount = typeof monthData === 'object' ? monthData.confirmed_amount : null;
  const isAlreadyConfirmed = existingConfirmedAmount !== null && existingConfirmedAmount !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Confirm Collection</DialogTitle>
          <DialogDescription>
            Verify and confirm the collected amount for {vendo.name} - {formatMonthLabel(monthKey)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isAlreadyConfirmed && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
              This collection has already been confirmed. Confirming again will update the previous confirmation.
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
              Collector's Reported Amount
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              ₱{collectorAmount?.toLocaleString() || 0}
            </div>
            {typeof monthData === 'object' && monthData.remarks && (
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 italic">
                Note: {monthData.remarks}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmed-amount">Confirmed Amount (After Counting)</Label>
            <Input
              id="confirmed-amount"
              type="number"
              placeholder="Enter confirmed amount"
              value={confirmedAmount}
              onChange={(e) => setConfirmedAmount(e.target.value)}
              min="0"
              autoFocus
            />
          </div>

          {confirmedAmount && !isNaN(parseInt(confirmedAmount)) && (
            <div className={`rounded-lg p-4 ${
              parseInt(confirmedAmount) === collectorAmount
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                : 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800'
            }`}>
              <div className="text-sm font-medium mb-1">
                Discrepancy
              </div>
              <div className="text-2xl font-bold">
                {parseInt(confirmedAmount) === collectorAmount ? (
                  <span className="text-green-600 dark:text-green-400">
                    ₱0 - No Discrepancy ✓
                  </span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400">
                    ₱{Math.abs(collectorAmount - parseInt(confirmedAmount)).toLocaleString()}
                    {collectorAmount > parseInt(confirmedAmount) ? ' (Short)' : ' (Over)'}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="audit-remarks">Auditor Remarks (Optional)</Label>
            <Textarea
              id="audit-remarks"
              placeholder="Add notes about the confirmation..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Confirming...' : 'Confirm Collection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
