import { create } from "zustand";

const readStoredAuth = () => {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  try {
    const token = window.localStorage.getItem("authToken");
    const userRaw = window.localStorage.getItem("authUser");
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const useAuthStore = create((set) => ({
  ...readStoredAuth(),
  setAuth: ({ token, user }) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("authToken", token);
      window.localStorage.setItem("authUser", JSON.stringify(user));
    }

    set({ token, user });
  },
  clearAuth: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("authUser");
    }

    set({ token: null, user: null });
  }
}));