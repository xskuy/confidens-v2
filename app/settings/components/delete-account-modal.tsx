'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onConfirm: () => Promise<void>;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  userName,
  onConfirm,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const projectName = 'Confidens_two';
  const isConfirmed = confirmText === projectName;

  const handleDelete = async () => {
    if (!isConfirmed) {
      toast.error(`Please type "${projectName}" to confirm`);
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      toast.error('Error deleting account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">
            Confirm deletion of Confidens_two
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Warning Section */}
          <div className="flex items-center space-x-3">
            <div className="shrink-0">
              <div className="flex items-center justify-center size-8 bg-orange-500 rounded">
                <AlertTriangle className="size-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-white">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-600" />

          {/* Description */}
          <div>
            <p className="text-sm text-gray-300">
              This will permanently delete the Confidens_two project and all of
              its data.
            </p>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-600" />

          {/* Confirmation Input */}
          <div className="space-y-3">
            <Label htmlFor="confirm-deletion" className="text-sm text-gray-300">
              Type <span className="font-mono text-white">Confidens_two</span>{' '}
              to confirm.
            </Label>
            <Input
              id="confirm-deletion"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type the project name in here"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              autoComplete="off"
            />
          </div>

          {/* Action Button */}
          <Button
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:text-gray-400"
          >
            {isDeleting
              ? 'Deleting project...'
              : 'I understand, delete this project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
