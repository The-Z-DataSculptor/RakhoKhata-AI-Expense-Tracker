// Frontend/src/utils/api.ts

// RESTORED: Standardized back to localhost to maintain unified domain parity for cross-origin cookie sharing
const BACKEND_BASE_URL = "http://localhost:5000/api";

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BACKEND_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    ...options,
    // THE SECRET SAUCE: Forces the browser to send and receive the HttpOnly cookie automatically
    credentials: "include", 
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, defaultOptions);

    // If the server returns a bad status code (e.g., 400, 401, 500), throw a clean error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Network response error: ${response.status}`);
    }

    return response.json();
  } catch (error: unknown) {
    // If it's already our custom validation error, rethrow it directly
    if (error instanceof Error && !error.message.startsWith("Failed to fetch")) {
      throw error;
    }
    
    // Otherwise, provide a highly descriptive full-stack troubleshooting tip
    throw new Error("Unable to establish a secure link with the financial backend. Ensure your Express engine is running on port 5000.");
  }
};