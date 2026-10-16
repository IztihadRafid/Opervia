"use client";
import { useOrganization } from "@/components/providers/organization-provider";
import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ORGANIZATION_STORAGE_KEY = "opervia-organization-id";

export function CreateOrganizationDialog() {
  const { selectedOrganization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateOrganization(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Organization name must be between 2 and 100 characters.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": selectedOrganization?.id ?? "",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message ?? "Failed to create organization.");
      }

      const organizationId = result?.organization?.id;

      if (!organizationId) {
        throw new Error(
          "Organization was created, but its ID was not returned. Refresh the page to load your organizations.",
        );
      }

      window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, organizationId);

      window.location.reload();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isCreating) {
          setOpen(nextOpen);

          if (!nextOpen) {
            setError("");
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 bg-[#fce8e2]"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline ">Create organization</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Create organization
          </DialogTitle>
          <DialogDescription>
            Create a new workspace to manage applications, subscriptions,
            vendors, licenses, and expenses separately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="organization-name"
              className="text-sm font-medium leading-none"
            >
              Organization name
            </label>
            <Input
              id="organization-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. My Company"
              minLength={2}
              maxLength={100}
              required
              disabled={isCreating}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
