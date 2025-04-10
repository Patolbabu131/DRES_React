import { useState, useEffect, useRef } from 'react';
import { 
  FiMenu, 
  FiLogOut, 
  FiSettings, 
  FiChevronDown, 
  FiBell,
  FiSun,
  FiMoon,
  FiEdit
} from 'react-icons/fi';
import { TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AuthService } from '../../services/AuthService';

const Navbar = ({ isCollapsed, setIsCollapsed, isMobile }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [userData, setUserData] = useState({ 
    name: null, 
    role: null 
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications] = useState(3);
  const dropdownRef = useRef(null);

  const formatRole = (role) => {
    if (Array.isArray(role)) {
      role = role.length > 0 ? role[0] : 'User';
    }
    if (!role) return 'User';
    const roleString = String(role).trim().toLowerCase();
    
    switch(roleString) {
      case 'admin': return 'Admin';
      case 'sitemanager': return 'Site Manager';
      case 'siteengineer': return 'Site Engineer';
      default: 
        return roleString.charAt(0).toUpperCase() + roleString.slice(1);
    }
  };

  useEffect(() => {
    const fetchUserData = () => {
      const name = AuthService.getUsername();
      const roles = AuthService.getUserRoles();
      const primaryRole = Array.isArray(roles) && roles.length > 0 
        ? roles[0] 
        : 'User';
      setUserData({ name, role: primaryRole });
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
  };

  const getInitials = (name) => {
    if (!name) return 'RU';
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials.length === 1 ? initials + initials : initials;
  };

  const handleDashboardRedirect = () => {
    navigate('/dashboard');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-darkSurface border-b border-lightPrimary/20 dark:border-darkPrimary/20 z-40 shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-lightPrimary dark:text-darkPrimary hover:bg-lightPrimary/20 dark:hover:bg-darkPrimary/20 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isMobile ? (
              <FiMenu className="w-6 h-6" />
            ) : (
              <TbLayoutSidebarLeftCollapse className="w-6 h-6" />
            )}
          </button>
          <h1 
            onClick={handleDashboardRedirect} 
            className="text-xl font-semibold text-lightPrimary dark:text-darkPrimary cursor-pointer"
          >
            DRE StockLogic
          </h1>
        </div>

        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <div className="relative">
            <button
              className="p-2 rounded-lg text-lightPrimary dark:text-darkPrimary hover:bg-lightPrimary/20 dark:hover:bg-darkPrimary/20 transition-colors"
              aria-label="Notifications"
            >
              <FiBell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full bg-lightPrimary/10 dark:bg-darkPrimary/10 hover:bg-lightPrimary/20 dark:hover:bg-darkPrimary/20 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-lightPrimary dark:bg-darkPrimary text-white flex items-center justify-center font-medium">
                {getInitials(userData.name)}
              </div>
              <div className="text-sm font-semibold text-lightPrimary dark:text-darkPrimary">
                {formatRole(userData.role)}
              </div>
              <FiChevronDown className={`w-4 h-4 text-lightPrimary dark:text-darkPrimary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-darkSurface rounded-lg shadow-lg border border-lightPrimary/20 dark:border-darkPrimary/20">
                <div className="p-2 space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-lightPrimary/10 dark:border-darkPrimary/10">
                    <div className="h-10 w-10 rounded-full bg-lightPrimary dark:bg-darkPrimary text-white flex items-center justify-center font-medium">
                      {getInitials(userData.name)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-lightPrimary dark:text-darkPrimary">
                        {userData.name || 'Registered User'}
                      </div>
                    </div>
                  </div>

                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-lightPrimary dark:text-darkPrimary hover:bg-lightPrimary/10 dark:hover:bg-darkPrimary/10 rounded-md"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FiEdit className="w-4 h-4" />
                    Manage Profile
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-lightPrimary dark:text-darkPrimary hover:bg-lightPrimary/10 dark:hover:bg-darkPrimary/10 rounded-md"
                    onClick={() => {
                      toggleTheme();
                      setIsDropdownOpen(false);
                    }}
                  >
                    {isDark ? (
                      <FiSun className="w-4 h-4" />
                    ) : (
                      <FiMoon className="w-4 h-4" />
                    )}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-lightPrimary dark:text-darkPrimary hover:bg-lightPrimary/10 dark:hover:bg-darkPrimary/10 rounded-md"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FiSettings className="w-4 h-4" />
                    Settings
                  </button>

                  <hr className="border-lightPrimary/20 dark:border-darkPrimary/20 my-1" />

                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md"
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                    }}
                  >
                    <FiLogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
