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
import { store } from '@/routes/wifi-vendos';

interface CreateVendoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateVendoDialog({ open, onOpenChange }: CreateVendoDialogProps) {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    name: '',
    remarks: '',
  });

  useEffect(() => {
    if (open) {
      reset();
      clearErrors();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    post(store(), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('WiFi Vendo created successfully!');
        onOpenChange(false);
      },
      onError: (errors) => {
        toast.error('Failed to create WiFi Vendo');
        console.error(errors);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New WiFi Vendo</DialogTitle>
          <DialogDescription>
            Create a new WiFi vendo to start monitoring collections
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
              {processing ? 'Creating...' : 'Create Vendo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
