import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function tryParseErrorResponse(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorJson = await res.json();
      // Check for error message in JSON response
      if (errorJson.message) {
        return errorJson.message;
      }
      if (errorJson.error) {
        return errorJson.error;
      }
      // If no recognized error format, return the JSON as string
      return JSON.stringify(errorJson);
    } else {
      // Not JSON, try to get text
      const text = await res.text();
      return text || res.statusText;
    }
  } catch (err) {
    // If we can't parse the response at all, return the status text
    return res.statusText;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorMessage = await tryParseErrorResponse(res);
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // We don't call throwIfResNotOk here so caller can handle non-ok responses
    return res;
  } catch (error) {
    // Handle network errors
    console.error(`Network error during ${method} request to ${url}:`, error);
    throw new Error(`Network error: Could not reach server. Please check your connection.`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok) {
        const errorMessage = await tryParseErrorResponse(res);
        throw new Error(errorMessage);
      }

      // Only try to parse as JSON if the response is OK
      try {
        return await res.json();
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes instead of Infinity for better UX
      retry: 1, // One retry is reasonable
    },
    mutations: {
      retry: 0, // No retries for mutations to avoid duplicate operations
    },
  },
});
