"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useOrganization } from "@/components/providers/organization-provider";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export type ExpenseCategory =
  | "software"
  | "hardware"
  | "cloud_hosting"
  | "marketing"
  | "office"
  | "travel"
  | "professional_services"
  | "other";

export type ExpenseStatus = "paid" | "pending" | "overdue" | "cancelled";
export type ExpensePaymentMethod =
  "credit_card" | "debit_card" | "bank_transfer" | "cash" | "paypal" | "other";
export interface ExpenseItem {
  id: string;
  organizationId: string;
  vendorId: string | null;
  applicationId: string | null;
  title: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  expenseDate: string;
  dueDate: string | null;
  status: ExpenseStatus;
  paymentMethod: ExpensePaymentMethod | null;
  invoiceNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface ExpensesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  vendorId?: string;
  applicationId?: string;
}
export interface ExpensesResponse {
  success: boolean;
  expenses: ExpenseItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface CreateExpenseInput {
  title: string;
  description?: string | null;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  expenseDate: string;
  dueDate?: string | null;
  status?: ExpenseStatus;
  paymentMethod?: ExpensePaymentMethod | null;
  vendorId?: string | null;
  applicationId?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
}
export type UpdateExpenseInput = Partial<CreateExpenseInput>;
interface ExpenseResponse {
  success: boolean;
  expense: ExpenseItem;
  message?: string;
}
interface DeleteExpenseResponse {
  success: boolean;
  message?: string;
}
interface ExpenseQueryResponse {
  success: boolean;
  expense: ExpenseItem;
}
interface UpdateExpenseVariables {
  id: string;
  input: UpdateExpenseInput;
}
const DEFAULT_PAGE_SIZE = 25;
const expenseKeys = {
  all: (organizationId?: string) =>
    ["expenses", organizationId ?? "no-organization-selected"] as const,

  list: (organizationId: string | undefined, filters: ExpensesFilters) =>
    [
      "expenses",
      organizationId ?? "no-organization-selected",
      "list",
      filters,
    ] as const,

  detail: (organizationId: string | undefined, id: string) =>
    [
      "expenses",
      organizationId ?? "no-organization-selected",
      "detail",
      id,
    ] as const,
};

async function fetchExpenses(
  filters: ExpensesFilters,
): Promise<ExpensesResponse> {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? DEFAULT_PAGE_SIZE));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.vendorId) {
    params.set("vendorId", filters.vendorId);
  }

  if (filters.applicationId) {
    params.set("applicationId", filters.applicationId);
  }

  return apiClient<ExpensesResponse>(`/api/expenses?${params.toString()}`);
}

async function fetchExpense(id: string): Promise<ExpenseQueryResponse> {
  return apiClient<ExpenseQueryResponse>(
    `/api/expenses/${encodeURIComponent(id)}`,
  );
}

export function useExpenses(filters: ExpensesFilters = {}) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: expenseKeys.list(organizationId, filters),
    queryFn: () => fetchExpenses(filters),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useExpense(id: string) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: expenseKeys.detail(organizationId, id),
    queryFn: () => fetchExpense(id),
    enabled: Boolean(organizationId && id),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: (input: CreateExpenseInput) =>
      apiClient<ExpenseResponse>("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: expenseKeys.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: ({ id, input }: UpdateExpenseVariables) =>
      apiClient<ExpenseResponse>(`/api/expenses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),

    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: expenseKeys.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: expenseKeys.detail(organizationId, result.expense.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<DeleteExpenseResponse>(
        `/api/expenses/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      ),

    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: expenseKeys.all(organizationId),
        }),
        queryClient.removeQueries({
          queryKey: expenseKeys.detail(organizationId, id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}
