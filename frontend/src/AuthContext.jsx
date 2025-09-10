import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${backendUrl}/api/auth`;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized loadUser function
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // More robust token check
      if (typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error("Invalid token format");
      }

      const { data } = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
    } catch (err) {
      console.error("Auth check failed:", err);
      setError(err.message);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
      });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log(API_URL)
      const { data } = await axios.post(`${API_URL}/login`, { email, password });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        register, 
        login, 
        logout, 
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};