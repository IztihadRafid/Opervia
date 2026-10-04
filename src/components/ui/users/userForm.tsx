"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateUser } from "@/hooks/useCreateUser";
import { createUserSchema } from "@/lib/validations/user.validation";

type UserFormValues = z.input<typeof createUserSchema>;

interface UserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserForm({ onSuccess, onCancel }: UserFormProps) {
  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "member",
      status: "active",
    },
  });

  async function onSubmit(data: UserFormValues) {
    try {
      await createUserMutation.mutateAsync({
        name: data.name,
        email: data.email,
        role: data.role ?? "member",
        status: data.status ?? "active",
      });

      onSuccess?.();
    } catch {
      // The mutation error is displayed below.
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>

        <input
          id="name"
          type="text"
          placeholder="Enter user name"
          {...register("name")}
          disabled={createUserMutation.isPending}
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>

        <input
          id="email"
          type="email"
          placeholder="Enter email address"
          {...register("email")}
          disabled={createUserMutation.isPending}
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium">
          Role
        </label>

        <select
          id="role"
          {...register("role")}
          disabled={createUserMutation.isPending}
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
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>

        <select
          id="status"
          {...register("status")}
          disabled={createUserMutation.isPending}
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

      {createUserMutation.isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">
            {createUserMutation.error.message}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={createUserMutation.isPending}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={createUserMutation.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createUserMutation.isPending ? "Creating..." : "Create User"}
        </button>
      </div>
    </form>
  );
}
