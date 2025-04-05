import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token and set user data on mount
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
        
        // Extract roles
        const rolesClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
        const roles = decoded[rolesClaim];
        setUserRoles(Array.isArray(roles) ? roles : (roles ? [roles] : []));
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setUserRoles([]);
  };

  const isAuthenticated = () => {
    return !!currentUser;
  };

  const hasRole = (role) => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles) => {
    return roles.some(role => userRoles.includes(role));
  };

  const isAdmin = () => {
    return userRoles.includes('admin');
  };

  const isSiteManager = () => {
    return userRoles.includes('sitemanager');
  };

  const isSiteEngineer = () => {
    return userRoles.includes('siteengineer');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRoles,
        loading,
        isAuthenticated,
        hasRole,
        hasAnyRole,
        isAdmin,
        isSiteManager,
        isSiteEngineer,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;