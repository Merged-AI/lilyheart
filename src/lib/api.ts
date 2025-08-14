/**
 * API utility for Node.js backend communication
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

/**
 * Get the Node.js backend API URL
 */
function getApiUrl(endpoint: string): string {
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  if (cleanEndpoint.startsWith("api/")) {
    cleanEndpoint = cleanEndpoint.slice(4);
  }

  return `${BACKEND_URL}/api/${cleanEndpoint}`;
}

/**
 * Fetch wrapper for Node.js backend API calls
 */
export async function apiCall(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = getApiUrl(endpoint);

  // Default options for API calls
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // Important for cookies
    ...options,
  };

  return fetch(url, defaultOptions);
}

/**
 * FormData upload helper for file uploads
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options?: RequestInit
): Promise<T> {
  const url = getApiUrl(endpoint);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include", // Important for cookies
    ...options,
  });

  return handleApiResponse<T>(response);
}

/**
 * GET request helper - returns processed data
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(() => apiCall(endpoint, { method: "GET", ...options }));
}

/**
 * POST request helper - returns processed data
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(() =>
    apiCall(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  );
}

/**
 * PUT request helper - returns processed data
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(() =>
    apiCall(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  );
}

/**
 * DELETE request helper - returns processed data
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(() =>
    apiCall(endpoint, { method: "DELETE", ...options })
  );
}

// Legacy versions that return Response (for backward compatibility during migration)
export async function apiGetResponse(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  return apiCall(endpoint, { method: "GET", ...options });
}

export async function apiPostResponse(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<Response> {
  return apiCall(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

export async function apiDeleteResponse(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  return apiCall(endpoint, { method: "DELETE", ...options });
}

/**
 * Helper to handle API responses consistently
 * Handles both success/error objects and direct data responses
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      errorData.error || errorData.details || `HTTP ${response.status}`
    );
  }

  const data = await response.json();

  // If backend returns a structured response with success field, handle it
  if (typeof data === "object" && data !== null && "success" in data) {
    if (data.success === false) {
      throw new Error(data.error || data.details || "Operation failed");
    }
    // Return the actual data, not the wrapper
    return data as T;
  }

  // For direct data responses (like { children: [...] })
  return data as T;
}

/**
 * Simplified API response wrapper for consistent error handling
 */
export async function apiRequest<T>(
  apiFunction: () => Promise<Response>
): Promise<T> {
  try {
    const response = await apiFunction();
    return await handleApiResponse<T>(response);
  } catch (error) {
    // Re-throw with consistent error handling
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}

// Export types for better TypeScript support
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
