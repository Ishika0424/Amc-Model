// Mock mode configuration
export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== "false"; // Default to true
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// Health check to determine if backend is available
let backendAvailable = false;

export const checkBackendHealth = async (): Promise<boolean> => {
  if (MOCK_MODE) {
    return false; // Force mock mode if enabled
  }

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      timeout: 3000,
    });
    backendAvailable = response.ok;
    return response.ok;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
};

export const isBackendAvailable = () => backendAvailable;

// Initialize backend check
checkBackendHealth().then((available) => {
  if (!available) {
    console.log("🔧 Backend not available - running in mock mode");
  } else {
    console.log("✅ Backend connected successfully");
  }
});
