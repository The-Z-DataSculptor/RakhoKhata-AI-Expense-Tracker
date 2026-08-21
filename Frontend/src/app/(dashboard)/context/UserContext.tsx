// src/app/(dashboard)/context/UserContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { userService, UserProfile } from "@/utils/api";
import { toast } from "sonner";

interface UserContextType {
  user: UserProfile | null;
  refreshUser: () => Promise<void>;
  updateUserInState: (updates: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: UserProfile | null;
}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser);

  const refreshUser = useCallback(async () => {
    try {
      const response = await userService.getProfile();
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
      toast.error("Failed to reload user profile details.");
    }
  }, []);

  const updateUserInState = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <UserContext.Provider value={{ user, refreshUser, updateUserInState }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}