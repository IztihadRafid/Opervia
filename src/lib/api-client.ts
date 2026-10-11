const ORGANIZATION_STORAGE_KEY = "opervia-organization-id";

export async function apiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (typeof window !== "undefined") {
    const organizationId = window.localStorage.getItem(
      ORGANIZATION_STORAGE_KEY,
    );

    if (organizationId) {
      headers.set("x-organization-id", organizationId);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.message ?? "Something went wrong. Please try again.",
    );
  }

  return result as T;
}
