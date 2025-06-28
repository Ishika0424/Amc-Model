import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { authService, setupTokenRefresh } from "@/services/authService";
import { activityService } from "@/services/activityService";
import { isBackendAvailable } from "@/config/mockMode";
import { mockDataService, MOCK_CREDENTIALS } from "@/services/mockDataService";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  signup: (userData: Partial<User>, password: string) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  isLoading: boolean;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to get all users (with mock mode support)
export const getAllUsers = async (): Promise<User[]> => {
  if (!isBackendAvailable()) {
    // Use mock data service for offline mode
    return mockDataService.getUsers();
  }

  try {
    // Try to get users from backend
    return await authService.getAllUsers();
  } catch (error) {
    console.warn("Failed to fetch users from backend, using mock data:", error);
    // Fallback to mock data service
    return mockDataService.getUsers();
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Setup online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initialize auth state
    initializeAuth();

    // Setup token refresh only if backend is available
    let cleanupTokenRefresh: (() => void) | undefined;
    if (isBackendAvailable()) {
      cleanupTokenRefresh = setupTokenRefresh();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (cleanupTokenRefresh) {
        cleanupTokenRefresh();
      }
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for stored user session
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);

        if (isBackendAvailable() && isOnline) {
          // Validate token with backend
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            // Token might be expired, try to refresh
            try {
              await authService.refreshToken();
              const currentUser = await authService.getCurrentUser();
              setUser(currentUser);
            } catch (refreshError) {
              // Clear invalid session
              localStorage.removeItem("user");
              localStorage.removeItem("refreshToken");
              console.warn("Session expired, please login again");
            }
          }
        } else {
          // Offline mode or mock mode - use stored data
          setUser(userData);
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    role: UserRole,
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (isBackendAvailable() && isOnline) {
        // Use backend authentication
        const response = await authService.login({ email, password, role });
        setUser(response.user);

        // Track login activity
        try {
          await activityService.logActivity({
            type: "login",
            description: `User logged in`,
            metadata: { userId: response.user.id },
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        setIsLoading(false);
        return true;
      } else {
        // Mock mode - use stored credentials
        const credentials = mockDataService.getCredentials();
        const allUsers = mockDataService.getUsers();

        if (credentials[email] === password) {
          const foundUser = allUsers.find(
            (u) => u.email === email && u.role === role,
          );

          if (foundUser) {
            setUser(foundUser);
            localStorage.setItem("user", JSON.stringify(foundUser));
            setIsLoading(false);
            return true;
          }
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
    }

    setIsLoading(false);
    return false;
  };

  const signup = async (
    userData: Partial<User>,
    password: string,
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (isBackendAvailable() && isOnline) {
        // Use backend registration
        const signupData = {
          name: userData.name || "",
          email: userData.email || "",
          password,
          post: userData.post || "Staff",
          department: userData.department || "General",
        };

        const response = await authService.signup(signupData);
        setUser(response.user);

        // Track registration activity
        try {
          await activityService.logActivity({
            type: "user_registered",
            description: `New user registered: ${response.user.name}`,
            metadata: { userId: response.user.id, email: response.user.email },
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        setIsLoading(false);
        return true;
      } else {
        // Mock mode - save to localStorage
        const currentUsers = mockDataService.getUsers();
        const currentCredentials = mockDataService.getCredentials();

        // Check if email already exists
        if (userData.email && currentCredentials[userData.email]) {
          setIsLoading(false);
          return false;
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: userData.name || "",
          email: userData.email || "",
          role: "user",
          post: userData.post || "Staff",
          department: userData.department || "General",
          joinDate: new Date().toISOString().split("T")[0],
        };

        // Save to mock data
        const updatedUsers = [...currentUsers, newUser];
        mockDataService.saveUsers(updatedUsers);

        if (newUser.email) {
          const updatedCredentials = {
            ...currentCredentials,
            [newUser.email]: password,
          };
          mockDataService.saveCredentials(updatedCredentials);
        }

        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error("Signup failed:", error);
      setIsLoading(false);
      return false;
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      if (isBackendAvailable() && isOnline) {
        // Use backend API
        const updatedUser = await authService.updateProfile(userData);
        setUser(updatedUser);

        // Track profile update activity
        try {
          const changes = Object.keys(userData);
          await activityService.logActivity({
            type: "profile_updated",
            description: "Updated profile",
            metadata: { changes },
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        setIsLoading(false);
        return true;
      } else {
        // Mock mode - update localStorage
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Update user in mock data
        const users = mockDataService.getUsers();
        const updatedUsers = users.map((u) =>
          u.id === user.id ? updatedUser : u,
        );
        mockDataService.saveUsers(updatedUsers);

        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      setIsLoading(false);
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      if (isBackendAvailable() && isOnline) {
        await authService.changePassword({ currentPassword, newPassword });

        // Track password change activity
        try {
          await activityService.logActivity({
            type: "password_changed",
            description: "Password changed successfully",
            metadata: { userId: user.id },
          });
        } catch (activityError) {
          console.warn("Failed to log activity:", activityError);
        }

        setIsLoading(false);
        return true;
      } else {
        // Mock mode - check current password and update
        const credentials = mockDataService.getCredentials();

        if (credentials[user.email] === currentPassword) {
          const updatedCredentials = {
            ...credentials,
            [user.email]: newPassword,
          };
          mockDataService.saveCredentials(updatedCredentials);
          setIsLoading(false);
          return true;
        }

        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Password change failed:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (user && isBackendAvailable() && isOnline) {
      try {
        // Track logout activity
        await activityService.logActivity({
          type: "logout",
          description: "User logged out",
          metadata: { userId: user.id },
        });

        // Call backend logout
        await authService.logout();
      } catch (error) {
        console.error("Logout API call failed:", error);
      }
    }

    // Always clear local state
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        updateProfile,
        changePassword,
        isLoading,
        isOnline,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
