export async function apiClient<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result?.message ?? "Something went wrong. Please try again.",
    );
  }
  return result as T;
}
