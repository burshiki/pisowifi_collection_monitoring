import { useForm } from '@inertiajs/react';
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
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { WifiVendo } from '@/types/wifi-vendo';
import { update } from '@/routes/wifi-vendos';

interface UpdateVendoDialogProps {
  vendo: WifiVendo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateVendoDialog({ vendo, open, onOpenChange }: UpdateVendoDialogProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: vendo.name,
    remarks: vendo.remarks || '',
    monthly_collections: vendo.monthly_collections || {},
  });

  useEffect(() => {
    if (open && vendo) {
      setData({
        name: vendo.name,
        remarks: vendo.remarks || '',
        monthly_collections: vendo.monthly_collections || {},
      });
    }
  }, [open, vendo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    put(update(vendo.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('WiFi Vendo updated successfully!');
        onOpenChange(false);
      },
      onError: (errors) => {
        toast.error('Failed to update WiFi Vendo');
        console.error(errors);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit WiFi Vendo</DialogTitle>
          <DialogDescription>
            Update vendo name and remarks
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vendo Name</Label>
            <Input
              id="name"
              placeholder="e.g., Vendo #1 - Mall Branch"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Add any notes about this vendo..."
              value={data.remarks}
              onChange={(e) => setData('remarks', e.target.value)}
              rows={3}
              className={errors.remarks ? 'border-red-500' : ''}
            />
            {errors.remarks && <p className="text-sm text-red-500">{errors.remarks}</p>}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Updating...' : 'Update Vendo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
