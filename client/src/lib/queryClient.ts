import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Utility to throw error if fetch response is not ok
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Main API request function
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

// Handling 401 Unauthorized for fetches
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: (options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
  const res = await fetch(queryKey[0] as string, {
    credentials: "include",
  });
  if (unauthorizedBehavior === "returnNull" && res.status === 401) {
    return null;
  }
  await throwIfResNotOk(res);
  return await res.json();
};

// Default React Query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
