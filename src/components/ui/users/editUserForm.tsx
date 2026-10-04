"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateUser } from "@/hooks/useUpdateUser";
import { updateUserSchema } from "@/lib/validations/user.validation";
import type { User } from "@/hooks/use-users";

type EditUserFormValues = z.input<typeof updateUserSchema>;

interface EditUserFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const updateUserMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });

  async function onSubmit(data: EditUserFormValues) {
    try {
      await updateUserMutation.mutateAsync({
        userId: user._id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
      });

      onSuccess?.();
    } catch {
      // The mutation error is displayed below.
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="edit-user-name" className="text-sm font-medium">
          Name
        </label>

        <input
          id="edit-user-name"
          type="text"
          {...register("name")}
          disabled={updateUserMutation.isPending}
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-user-email" className="text-sm font-medium">
          Email
        </label>

        <input
          id="edit-user-email"
          type="email"
          {...register("email")}
          disabled={updateUserMutation.isPending}
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-user-role" className="text-sm font-medium">
          Role
        </label>

        <select
          id="edit-user-role"
          {...register("role")}
          disabled={updateUserMutation.isPending}
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>

        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-user-status" className="text-sm font-medium">
          Status
        </label>

        <select
          id="edit-user-status"
          {...register("status")}
          disabled={updateUserMutation.isPending}
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="suspended">Suspended</option>
        </select>

        {errors.status && (
          <p className="text-sm text-destructive">{errors.status.message}</p>
        )}
      </div>

      {updateUserMutation.isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">
            {updateUserMutation.error.message}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={updateUserMutation.isPending}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={updateUserMutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
