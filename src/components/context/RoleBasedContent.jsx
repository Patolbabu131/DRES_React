import React from 'react';
import { useAuth } from '../context/AuthContext';

// This component conditionally renders content based on user roles
const RoleBasedContent = ({ 
  children, 
  allowedRoles = [], 
  fallback = null 
}) => {
  const { hasAnyRole, userRoles } = useAuth();
  
  // If no roles specified or user has any of the allowed roles, render children
  if (allowedRoles.length === 0 || hasAnyRole(allowedRoles)) {
    return children;
  }
  
  // Otherwise, render fallback content or null
  return fallback;
};

export default RoleBasedContent;