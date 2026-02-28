import { router, usePage } from '@inertiajs/react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/wifi-vendos';
import type { Auth } from '@/types/auth';
import type { WifiVendo } from '@/types/wifi-vendo';

interface AddCollectionDialogProps {
  vendo: WifiVendo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCollectionDialog({ vendo, open, onOpenChange }: AddCollectionDialogProps) {
  const { auth } = usePage<{ auth: Auth }>().props;
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteRemarks, setDeleteRemarks] = useState('');

  const canDeleteCollection = auth.permissions?.includes('delete wifi vendo collections');

  const getCurrentMonthKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getCurrentMonthLabel = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAmount('');
      setRemarks('');
      setDeleteTarget(null);
      setDeleteRemarks('');
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendo) return;

    const currentMonthKey = getCurrentMonthKey();
    const existingCollection = vendo.monthly_collections?.[currentMonthKey];

    // Check if collection already exists - nobody can change it
    if (existingCollection) {
      const existingAmount = typeof existingCollection === 'object' ? existingCollection.amount : existingCollection;
      if (existingAmount && existingAmount > 0) {
        toast.error('Collection for this month already exists. If the amount is incorrect, request an admin to delete it first.');
        return;
      }
    }

    if (!amount) {
      toast.error('Please enter collection amount');
      return;
    }

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const updatedCollections = {
      ...vendo.monthly_collections,
      [currentMonthKey]: {
        amount: numAmount,
        remarks: remarks || null,
        collected_at: new Date().toISOString(),
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
      preserveState: false,
      onSuccess: () => {
        toast.success('Collection added successfully!');
        setAmount('');
        setRemarks('');
        setProcessing(false);
      },
      onError: (errors) => {
        toast.error('Failed to add collection');
        console.error(errors);
        setProcessing(false);
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!vendo || !deleteTarget) return;

    if (!deleteRemarks.trim()) {
      toast.error('Please provide a reason for deleting this collection.');
      return;
    }

    const updatedCollections = { ...vendo.monthly_collections };
    delete updatedCollections[deleteTarget];

    setProcessing(true);
    router.put(update(vendo.id).url, {
      name: vendo.name,
      remarks: vendo.remarks,
      // @ts-expect-error - Inertia handles nested objects correctly despite type definition
      monthly_collections: updatedCollections,
      deleted_month_key: deleteTarget,
      deletion_remarks: deleteRemarks.trim(),
    }, {
      preserveScroll: true,
      preserveState: false,
      onSuccess: () => {
        toast.success('Collection removed successfully!');
        setDeleteTarget(null);
        setDeleteRemarks('');
        setProcessing(false);
      },
      onError: (errors) => {
        toast.error('Failed to remove collection');
        console.error(errors);
        setProcessing(false);
      },
    });
  };

  if (!vendo) return null;

  const currentMonthKey = getCurrentMonthKey();
  const existingCollection = vendo.monthly_collections?.[currentMonthKey];
  const hasCurrentMonthCollection = existingCollection &&
    (typeof existingCollection === 'object' ? existingCollection.amount > 0 : existingCollection > 0);
  const canAddCollection = !hasCurrentMonthCollection;

  const sortedCollections = Object.entries(vendo.monthly_collections || {})
    .sort(([a], [b]) => b.localeCompare(a));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Collections - {vendo.name}</DialogTitle>
          <DialogDescription>
            Add new collection or manage existing collections
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Collection Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`border rounded-lg p-4 ${
              hasCurrentMonthCollection
                ? 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
                : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            }`}>
              <h3 className={`font-semibold mb-3 ${
                hasCurrentMonthCollection
                  ? 'text-gray-600 dark:text-gray-400'
                  : 'text-green-900 dark:text-green-100'
              }`}>
                Add Collection for {getCurrentMonthLabel()}
              </h3>

              {hasCurrentMonthCollection && (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
                  Collection for this month already exists. If the amount is incorrect, {canDeleteCollection ? 'delete it below and add a new one' : 'request an admin to delete it first'}.
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Collection Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount collected"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    disabled={!canAddCollection}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection-remarks">Remarks (Optional)</Label>
                  <Textarea
                    id="collection-remarks"
                    placeholder="Add notes about this collection..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    disabled={!canAddCollection}
                  />
                </div>

                <Button type="submit" disabled={processing || !canAddCollection} className="w-full">
                  {processing ? 'Adding...' : hasCurrentMonthCollection ? 'Collection Already Exists' : 'Add Collection'}
                </Button>
              </div>
            </div>
          </form>

          {/* Previous Collections */}
          {sortedCollections.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Previous Collections</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {sortedCollections.map(([monthKey, collectionData]) => {
                    const isObject = typeof collectionData === 'object';
                    const collectionAmount = isObject ? collectionData.amount : collectionData;
                    const collectionRemarks = isObject ? collectionData.remarks : null;
                    const collectedAtDate = isObject ? collectionData.collected_at : null;
                    const isDeleteTarget = deleteTarget === monthKey;

                    return (
                      <Card key={monthKey} className={`p-4 ${isDeleteTarget ? 'border-red-300 dark:border-red-700' : ''}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {formatMonthLabel(monthKey)}
                              </span>
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                ₱{collectionAmount?.toLocaleString() || 0}
                              </span>
                            </div>
                            {collectionRemarks && (
                              <p className="text-sm text-muted-foreground italic">
                                {collectionRemarks}
                              </p>
                            )}
                            {collectedAtDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Collected: {new Date(collectedAtDate).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                          </div>
                          {canDeleteCollection && !isDeleteTarget && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(monthKey)}
                              disabled={processing}
                              className="text-red-600 hover:text-red-700 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Inline delete confirmation with remarks */}
                        {isDeleteTarget && (
                          <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 space-y-3">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <p className="text-sm font-medium">
                                Provide a reason before deleting this collection.
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`delete-remarks-${monthKey}`} className="text-sm">
                                Reason for deletion <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                id={`delete-remarks-${monthKey}`}
                                placeholder="Enter reason for deleting this collection..."
                                value={deleteRemarks}
                                onChange={(e) => setDeleteRemarks(e.target.value)}
                                rows={2}
                                disabled={processing}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => { setDeleteTarget(null); setDeleteRemarks(''); }}
                                disabled={processing}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleConfirmDelete}
                                disabled={processing || !deleteRemarks.trim()}
                              >
                                {processing ? 'Deleting...' : 'Confirm Delete'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={processing}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
