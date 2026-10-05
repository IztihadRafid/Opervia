"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import type { Invitation } from "@/hooks/useInvitations";
import { useRevokeInvitation } from "@/hooks/useRevokeInvitation";

type RevokeInvitationDialogProps = {
  invitation: Invitation | null;
  open: boolean;
  onClose: () => void;
};

export function RevokeInvitationDialog({
  invitation,
  open,
  onClose,
}: RevokeInvitationDialogProps) {
  const revokeInvitation = useRevokeInvitation();

  const handleRevoke = () => {
    if (!invitation) return;

    revokeInvitation.mutate(invitation._id, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !revokeInvitation.isPending) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revoke invitation?</DialogTitle>

          <DialogDescription>
            {invitation
              ? `The invitation sent to ${invitation.email} will no longer be usable.`
              : "This invitation will no longer be usable."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={revokeInvitation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleRevoke}
            disabled={!invitation || revokeInvitation.isPending}
          >
            {revokeInvitation.isPending ? "Revoking..." : "Revoke invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
