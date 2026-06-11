/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authService } from '../services/api/authService';
import { storageService } from '../services/storage/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => storageService.getToken());
  const [user, setUser] = useState(() => storageService.getUser());
  const [pendingIdentifier, setPendingIdentifier] = useState('');

  useEffect(() => {
    const handleLogout = () => {
      setToken(null);
      setUser(null);
      setPendingIdentifier('');
    };
    
    window.addEventListener('payswift:logout', handleLogout);
    return () => window.removeEventListener('payswift:logout', handleLogout);
  }, []);

  const login = useCallback(async ({ identifier }) => {
    const res = await authService.login({ identifier });
    setPendingIdentifier(identifier);
    return res;
  }, []);

  const verifyOtp = useCallback(async (otp) => {
    const { token: nextToken, user: nextUser } = await authService.verifyOtp({
      otp,
      pendingIdentifier,
    });
    setToken(nextToken);
    setUser(nextUser);
    return { token: nextToken, user: nextUser };
  }, [pendingIdentifier]);

  const signup = useCallback(async (profile) => {
    const { user: nextUser } = await authService.signup(profile);
    return { user: nextUser };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      user,
      pendingIdentifier,
      login,
      verifyOtp,
      signup,
      logout,
    }),
    [token, user, pendingIdentifier, login, verifyOtp, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
