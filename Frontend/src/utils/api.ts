// Frontend/src/utils/api.ts

/* ==========================================================================
   === SECTION 1: CORE ARCHITECTURE & DATA CONTRACTS ===
   ========================================================================== */
/*
 * WHY THIS IS NEEDED:
 * The backend URL must come from an environment variable so that the same
 * frontend build works in development, staging, and production without
 * any code changes. NEXT_PUBLIC_API_URL is the standard Next.js variable
 * for client‑side code. The fallback is only used for local development.
 */
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  workspaceId: string;
  isFixed: boolean;
  isRecurring: boolean;
  frequency: string | null;
  dueDay: number | null;
  reminderDays: number | null;
}

export interface Transaction {
  id: string;
  amount?: number; // legacy field – may still be present in old data
  type: string;
  description: string;
  date: string;
  workspaceId: string;
  categoryId: string;
  category?: Category;
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
}

export interface Budget {
  id: string;
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
  startDate: string;
  endDate: string;
  categoryId: string;
  workspaceId: string;
  category?: Category;
  spentAmount?: number; // computed by backend
}

export interface InvestmentHistoryNode {
  id: string;
  date: string;
  title: string;
  note: string;
  amountAtTime: string;
  investedAtTime: number;
  valueAtTime: number;
  roiAtTime: string;
  isProfitAtTime: boolean;
}

export interface InvestmentAsset {
  id: string;
  assetSymbol: string;
  categoryClass: string;
  isCustomProfile: boolean;
  quantity: number;
  strategyNote: string;
  workspaceId: string;
  originalAmount: number;
  originalCurrency: string;
  baseAmountUSD: number;
  name?: string;
  icon?: string;
  userNote?: string;
  history?: InvestmentHistoryNode[];
  totalInvested?: number; // legacy compatibility
  capitalCurrency?: string; // legacy compatibility
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  sourceType: string;
  sourceId: string | null;
  isRead: boolean;
  readAt: string | null;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  uiTheme: string;
  country: string | null;
  currency: string | null;
  languages: string[];
  occupation: string | null;
  financialGoal: string | null;
  aiPersona: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  currency: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: GENERIC FETCH WRAPPER ===
   ========================================================================== */
/**
 * Base fetch function for all API calls.
 * Automatically includes credentials and JSON content‑type unless
 * the body is a FormData object (used for file uploads).
 *
 * WHY THIS IS NEEDED:
 * Centralising all API communication in one function means we can
 * apply consistent error handling, logging, and security headers
 * in a single place instead of repeating them in every service.
 */
export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${BACKEND_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  // When body is FormData, let the browser set the multipart boundary
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const mergedOptions: RequestInit = {
    ...options,
    credentials: "include", // Send HttpOnly cookies for authentication
    headers,
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      // Try to extract a human‑readable error from the backend JSON response
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData: unknown = await response.json();
        if (
          typeof errorData === "object" &&
          errorData !== null &&
          "error" in errorData
        ) {
          errorMessage = (errorData as { error: string }).error;
        }
      } catch {
        // If the response body isn't valid JSON, use the default message
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  } catch (error: unknown) {
    // Re‑throw backend errors so callers can display them to the user
    if (
      error instanceof Error &&
      !error.message.startsWith("Failed to fetch")
    ) {
      throw error;
    }
    // Wrap network errors in a user‑friendly message
    throw new Error(
      "Unable to connect to the financial backend. Please check your connection and ensure the server is running."
    );
  }
};
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: STRONGLY‑TYPED SERVICES ===
   ========================================================================== */
export const transactionService = {
  getByWorkspace: (workspaceId: string) =>
    apiFetch<{ transactions: Transaction[] }>(
      `/transactions?workspaceId=${workspaceId}`,
      { method: "GET" }
    ),

  create: (data: Omit<Transaction, "id" | "category">) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      "/transactions",
      { method: "POST", body: JSON.stringify(data) }
    ),

  bulkCreate: (data: {
    workspaceId: string;
    transactions: Omit<Transaction, "id" | "category">[];
  }) =>
    apiFetch<{ message: string }>("/transactions/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/transactions/${id}`, {
      method: "DELETE",
    }),
};

export const categoryService = {
  getByWorkspace: (workspaceId: string) =>
    apiFetch<{ categories: Category[] }>(
      `/categories?workspaceId=${workspaceId}`,
      { method: "GET" }
    ),

  create: (data: Omit<Category, "id">) =>
    apiFetch<{ message: string; category: Category }>(
      "/categories",
      { method: "POST", body: JSON.stringify(data) }
    ),

  update: (id: string, data: Partial<Omit<Category, "id">>) =>
    apiFetch<{ message: string; category: Category }>(
      `/categories/${id}`,
      { method: "PUT", body: JSON.stringify(data) }
    ),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/categories/${id}`, {
      method: "DELETE",
    }),
};

export const budgetService = {
  getByWorkspace: (workspaceId: string) =>
    apiFetch<{ budgets: Budget[] }>(
      `/budgets?workspaceId=${workspaceId}`,
      { method: "GET" }
    ),

  create: (
    data: Omit<Budget, "id" | "category" | "spentAmount">
  ) =>
    apiFetch<{ message: string; budget: Budget }>("/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<
      Omit<Budget, "id" | "category" | "spentAmount">
    >
  ) =>
    apiFetch<{ message: string; budget: Budget }>(
      `/budgets/${id}`,
      { method: "PUT", body: JSON.stringify(data) }
    ),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/budgets/${id}`, {
      method: "DELETE",
    }),
};

export const investmentService = {
  getByWorkspace: (workspaceId: string) =>
    apiFetch<{ investments: InvestmentAsset[] }>(
      `/investments?workspaceId=${workspaceId}`,
      { method: "GET" }
    ),

  create: (
    data: Partial<InvestmentAsset> & Record<string, unknown>
  ) =>
    apiFetch<{ message: string; asset: InvestmentAsset }>(
      "/investments",
      { method: "POST", body: JSON.stringify(data) }
    ),

  update: (
    id: string,
    data: Partial<InvestmentAsset> & Record<string, unknown>
  ) =>
    apiFetch<{ message: string; asset: InvestmentAsset }>(
      `/investments/${id}`,
      { method: "PUT", body: JSON.stringify(data) }
    ),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/investments/${id}`, {
      method: "DELETE",
    }),
};

export const vaultAuthService = {
  checkStatus: () =>
    apiFetch<{ hasPin: boolean }>("/auth/vault/pin-status", {
      method: "GET",
    }),

  setupPin: (pin: string) =>
    apiFetch<{ message: string }>(
      "/auth/vault/pin-setup",
      { method: "POST", body: JSON.stringify({ pin }) }
    ),

  verifyPin: (pin: string) =>
    apiFetch<{ success: boolean; message: string }>(
      "/auth/vault/pin-verify",
      { method: "POST", body: JSON.stringify({ pin }) }
    ),

  disablePin: () =>
    apiFetch<{ success: boolean; message: string }>(
      "/auth/vault/pin-disable",
      { method: "POST" }
    ),
};

// 🚀 Extended aiService with greeting and analysis endpoints
export const aiService = {
  // Existing general question endpoint
  ask: (
    question: string,
    persona: "auditor" | "coach" | "minimalist",
    workspaceId: string
  ) =>
    apiFetch<{ response: string }>("/ai/ask", {
      method: "POST",
      body: JSON.stringify({ question, persona, workspaceId }),
    }),

  // New: Daily companion greeting
  greeting: (workspaceId: string) =>
    apiFetch<{
      user: { name: string; aiPersona: string };
      greeting: string;
      cooldowns: { today: boolean; week: boolean; month: boolean };
    }>("/ai/greeting", {
      method: "POST",
      body: JSON.stringify({ workspaceId }),
    }),

  // New: Execute scoped analysis
  executeAnalysis: (scope: "today" | "week" | "month", workspaceId: string) =>
    apiFetch<{
      success: boolean;
      analysisReport: string;
    }>("/ai/execute-analysis", {
      method: "POST",
      body: JSON.stringify({ scope, workspaceId }),
    }),
};

export const notificationService = {
  getAll: () =>
    apiFetch<{ notifications: Notification[] }>(
      "/notifications",
      { method: "GET" }
    ),

  markAsRead: (id: string) =>
    apiFetch<{ message: string; notification: Notification }>(
      `/notifications/${id}/read`,
      { method: "PATCH" }
    ),

  markAllAsRead: () =>
    apiFetch<{ message: string; count: number }>(
      "/notifications/read-all",
      { method: "PATCH" }
    ),
};

export const userService = {
  getProfile: () =>
    apiFetch<{ user: UserProfile }>("/auth/me", {
      method: "GET",
    }),

  updateProfile: (
    data: Partial<Omit<UserProfile, "id" | "createdAt">>
  ) =>
    apiFetch<{ message: string; user: UserProfile }>(
      "/auth/update-profile",
      { method: "PUT", body: JSON.stringify(data) }
    ),

  changePassword: (
    currentPassword: string,
    newPassword: string
  ) =>
    apiFetch<{ message: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    ),

  uploadAvatar: (formData: FormData) =>
    apiFetch<{ message: string; avatarUrl: string }>(
      "/users/upload-avatar",
      { method: "POST", body: formData }
    ),
};

export const workspaceService = {
  update: (
    id: string,
    data: Partial<{ name: string; currency: string }>
  ) =>
    apiFetch<{ message: string; workspace: Workspace }>(
      `/workspaces/${id}`,
      { method: "PUT", body: JSON.stringify(data) }
    ),
};
/* === SECTION 3 END === */