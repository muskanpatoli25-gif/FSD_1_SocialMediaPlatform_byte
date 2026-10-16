
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("linkup_token")
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("linkup_user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = (newToken, userData) => {
    localStorage.setItem("linkup_token", newToken);
    localStorage.setItem("linkup_user", JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("linkup_token");
    localStorage.removeItem("linkup_user");

    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
