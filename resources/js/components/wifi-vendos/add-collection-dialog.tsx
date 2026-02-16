import { router, usePage } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (open) {
      setAmount('');
      setRemarks('');
    }
  }, [open]);

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

  const handleRemoveCollection = (monthKey: string) => {
    if (!vendo) return;

    if (!window.confirm(`Are you sure you want to remove the collection for ${formatMonthLabel(monthKey)}?`)) {
      return;
    }

    const updatedCollections = { ...vendo.monthly_collections };
    delete updatedCollections[monthKey];

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
        toast.success('Collection removed successfully!');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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

                    return (
                      <Card key={monthKey} className="p-4">
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
                          </div>
                          {canDeleteCollection && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveCollection(monthKey)}
                              disabled={processing}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
              onClick={() => onOpenChange(false)}
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
