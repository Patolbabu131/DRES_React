import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';

const API_URL = 'https://localhost:7022/api';

export const AuthService = {
  login: async (username, password, ipAddress, deviceType, location) => {
    try {
      const response = await fetch(`${API_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
          Password: password,
          IpAddress: ipAddress,
          DeviceType: deviceType,
          Location: location
        }),
      });

      let errorMessage = 'Login failed';
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } else {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken || '');
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  },

  isTokenValid: (token = null) => {
    try {
      const tokenToCheck = token || localStorage.getItem('token');
      if (!tokenToCheck) return false;
      
      const decoded = jwtDecode(tokenToCheck);
      // Add a small buffer (30 seconds) to account for timing issues
      return decoded.exp * 1000 > Date.now() + 30000;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },

  getUserRoles: () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];
      
      const decoded = jwtDecode(token);
      const rolesClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
      const roles = decoded[rolesClaim];
      
      // Handle single role string or array
      return Array.isArray(roles) ? roles : (roles ? [roles] : []);
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  },

  getUserId: () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const decoded = jwtDecode(token);
      const userIdClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
      
      // Check the specific claim URI first, then fallback to other common claims
      return decoded[userIdClaim] || decoded.sub || decoded.userId || decoded.nameid || decoded.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_URL}/Auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken || refreshToken);
      
      return data.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  }

  // setupTokenRefresh: () => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     if (!token) return;

  //     const decoded = jwtDecode(token);
  //     const expiresIn = decoded.exp * 1000 - Date.now();
      
  //     // Set up refresh 1 minute before expiration
  //     if (expiresIn > 60000) {
  //       setTimeout(async () => {
  //         try {
  //           await AuthService.refreshToken();
  //           // After successful refresh, set up the next refresh
  //           AuthService.setupTokenRefresh();
  //         } catch (error) {
  //           console.error('Auto refresh failed:', error);
  //           // Handle refresh failure (e.g., redirect to login)
  //           window.location.href = '/';
  //         }
  //       }, expiresIn - 60000);
  //     } else {
  //       // Token is already too close to expiration, refresh immediately
  //       AuthService.refreshToken()
  //         .then(() => AuthService.setupTokenRefresh())
  //         .catch(error => {
  //           console.error('Immediate refresh failed:', error);
  //           window.location.href = '/';
  //         });
  //     }
  //   } catch (error) {
  //     console.error('Setup token refresh error:', error);
  //   }
  // }
};

export default AuthService;
