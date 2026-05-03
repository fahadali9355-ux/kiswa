import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('kiswa_admin_token'));
  const [user, setUser] = useState<any>(
    localStorage.getItem('kiswa_admin_user') ? JSON.parse(localStorage.getItem('kiswa_admin_user') as string) : null
  );
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('kiswa_admin_token');
    localStorage.removeItem('kiswa_admin_user');
    setToken(null);
    setUser(null);
    navigate('/admin/login');
  };

  const login = (newToken: string, newUser: any) => {
    localStorage.setItem('kiswa_admin_token', newToken);
    localStorage.setItem('kiswa_admin_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  return {
    token,
    user,
    logout,
    login,
    isAuthenticated: !!token,
  };
}
