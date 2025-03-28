import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse the response as JSON first
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        console.error("API error response:", errorData);
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      }
      
      // If not JSON or no message property, fall back to text
      const text = (await res.text()) || res.statusText;
      console.error(`API error: ${res.status} - ${text}`);
      throw new Error(`${res.status}: ${text}`);
    } catch (parseError) {
      // If we can't parse the response (e.g., invalid JSON), use status text
      if (parseError instanceof Error && parseError.message !== res.statusText) {
        throw parseError; // If we already created a custom error message
      }
      console.error(`API error: ${res.status} - ${res.statusText}`);
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`API Request: ${method} ${url}`, data ? JSON.stringify(data) : 'No Data');
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`API Response Status: ${res.status} ${res.statusText}`);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      console.log(`Query Request: GET ${queryKey[0]}`);
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      console.log(`Query Response Status: ${res.status} ${res.statusText}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('Unauthorized request handled with returnNull behavior');
        return null;
      }
      
      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Query Request Failed:', error);
      throw error;
    }
  };

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
