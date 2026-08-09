// Frontend/src/utils/api.ts

/* ==========================================================================
   === SECTION 1: CORE ARCHITECTURE & DATA CONTRACTS ===
   ========================================================================== */
export const getApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    let baseUrl =
      process.env.INTERNAL_API_URL ||
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000";

    baseUrl = baseUrl.replace(/\/+$/, "");
    if (!baseUrl.endsWith("/api")) {
      baseUrl += "/api";
    }
    return baseUrl;
  }

  return "/api";
};

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
  amount?: number;
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
  spentAmount?: number;
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
  totalInvested?: number;
  capitalCurrency?: string;
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
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
  isOnboardingCompleted?: boolean;
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
   === SECTION 2: GENERIC FETCH WRAPPER WITH RESILIENCE & RETRIES ===
   ========================================================================== */
export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  // 15-second request timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const mergedOptions: RequestInit = {
    ...options,
    credentials: "include",
    signal: options.signal || controller.signal,
    headers,
  };

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(timeoutId);

    // Read response body as plain text first to safely check content length
    const responseText = await response.text();
    let responseData: unknown = null;

    if (responseText && responseText.trim().length > 0) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // Fallback for non-JSON string responses
        responseData = { message: responseText };
      }
    }

    if (!response.ok) {
      // Auto-retry transient HTTP 502, 503, and 504 gateway errors
      if (retries > 0 && response.status >= 502 && response.status <= 504) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return apiFetch<T>(endpoint, options, retries - 1);
      }

      let errorMessage = `Request failed with status ${response.status}`;
      if (typeof responseData === "object" && responseData !== null) {
        if ("error" in responseData && typeof (responseData as { error: unknown }).error === "string") {
          errorMessage = (responseData as { error: string }).error;
        } else if ("message" in responseData && typeof (responseData as { message: unknown }).message === "string") {
          errorMessage = (responseData as { message: string }).message;
        }
      }
      throw new Error(errorMessage);
    }

    // Safely return empty object for HTTP 204 or empty string payloads
    if (response.status === 204 || responseData === null) {
      return {} as T;
    }

    return responseData as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // Auto-retry network drops if retry attempts remain
    if (retries > 0 && error instanceof Error && error.name !== "AbortError") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return apiFetch<T>(endpoint, options, retries - 1);
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Connection timed out. Please check your network connection.");
    }

    if (
      error instanceof Error &&
      !error.message.startsWith("Failed to fetch")
    ) {
      throw error;
    }
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

  create: (data: Omit<Budget, "id" | "category" | "spentAmount">) =>
    apiFetch<{ message: string; budget: Budget }>("/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<Omit<Budget, "id" | "category" | "spentAmount">>
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

  create: (data: Partial<InvestmentAsset> & Record<string, unknown>) =>
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

  setupPin: (pin: string, currentPin?: string) =>
    apiFetch<{ success: boolean; message: string }>(
      "/auth/vault/pin-setup",
      { method: "POST", body: JSON.stringify({ pin, currentPin }) }
    ),

  verifyPin: (pin: string) =>
    apiFetch<{ success: boolean; message?: string; error?: string }>(
      "/auth/vault/pin-verify",
      { method: "POST", body: JSON.stringify({ pin }) }
    ),

  disablePin: (pin: string) =>
    apiFetch<{ success: boolean; message: string }>(
      "/auth/vault/pin-disable",
      { method: "POST", body: JSON.stringify({ pin }) }
    ),

  requestPinReset: () =>
    apiFetch<{ success: boolean; message: string }>(
      "/auth/vault/pin-request-reset",
      { method: "POST" }
    ),

  resetPinWithToken: (token: string, newPin: string) =>
    apiFetch<{ success: boolean; message: string }>(
      "/auth/vault/pin-reset-confirm",
      { method: "POST", body: JSON.stringify({ token, newPin }) }
    ),
};

export const aiService = {
  ask: (
    question: string,
    persona: "auditor" | "coach" | "minimalist",
    workspaceId: string
  ) =>
    apiFetch<{ response: string }>("/ai/ask", {
      method: "POST",
      body: JSON.stringify({ question, persona, workspaceId }),
    }),

  greeting: (workspaceId: string) =>
    apiFetch<{
      user: { name: string; aiPersona: string };
      greeting: string;
      cooldowns: { today: boolean; week: boolean; month: boolean };
    }>("/ai/greeting", {
      method: "POST",
      body: JSON.stringify({ workspaceId }),
    }),

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

  updateProfile: (data: Partial<Omit<UserProfile, "id" | "createdAt">>) =>
    apiFetch<{ message: string; user: UserProfile }>(
      "/auth/update-profile",
      { method: "PUT", body: JSON.stringify(data) }
    ),

  changePassword: (currentPassword: string, newPassword: string) =>
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
