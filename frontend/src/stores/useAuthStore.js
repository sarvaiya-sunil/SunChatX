import { create } from "zustand";

export const useAuthStore = create((set) => ({
  authUser: { name: "Sunil", id: 123, age: 25 },
  isLoggedIn: false,
  isLoading: false,

  login: () => {
    console.log("Login function called");
    set({ isLoggedIn: true, isLoading: true });
  },
}));
