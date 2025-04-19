import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  updateProfileMutation: UseMutationResult<SelectUser, Error, Partial<InsertUser>>;
  updateAvailabilityMutation: UseMutationResult<SelectUser, Error, { availability: string }>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // First initialize auth state by checking if the user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Make a simple request to check auth status
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          queryClient.setQueryData(["/api/user"], userData);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setAuthInitialized(true);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Only enable the query once we've initialized auth state
    enabled: authInitialized,
    // Don't refetch on window focus to avoid unnecessary auth checks
    refetchOnWindowFocus: false,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Invalid username or password");
        }
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An unexpected error occurred during login");
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      try {
        const res = await apiRequest("POST", "/api/register", userData);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Username may already be taken");
        }
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An unexpected error occurred during registration");
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Username may already be taken",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/logout");
        if (!res.ok) {
          throw new Error("Logout failed");
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An unexpected error occurred during logout");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to log out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (userData: Partial<InsertUser>) => {
      try {
        const res = await apiRequest("PUT", "/api/user", userData);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update profile");
        }
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An unexpected error occurred while updating profile");
      }
    },
    onSuccess: (updatedUser: SelectUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ availability }: { availability: string }) => {
      try {
        const res = await apiRequest("PUT", "/api/user/availability", { availability });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update status");
        }
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An unexpected error occurred while updating status");
      }
    },
    onSuccess: (updatedUser: SelectUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message || "Could not update your status",
        variant: "destructive",
      });
    },
  });

  // Show a loading state before auth is initialized
  if (!authInitialized) {
    // Just return a minimal provider with loading state while initializing
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isLoading: true,
          error: null,
          loginMutation: loginMutation as any,
          logoutMutation: logoutMutation as any,
          registerMutation: registerMutation as any,
          updateProfileMutation: updateProfileMutation as any,
          updateAvailabilityMutation: updateAvailabilityMutation as any,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        updateAvailabilityMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
