import { FiMenu, FiSun, FiMoon, FiChevronRight, FiLogOut } from 'react-icons/fi';
import { TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
 import { useTheme } from '../context/ThemeContext';
 import {AuthService} from '../../services/AuthService';

const Navbar = ({ isCollapsed, setIsCollapsed,  setIsDark, isMobile }) => {
  const { isDark, toggleTheme } = useTheme();
  const handleLogout = () => {
    AuthService.logout();
};

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-darkSurface border-b border-lightPrimary/20 dark:border-darkPrimary/20 z-40 shadow-sm">
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
          <h1 className="text-xl font-semibold text-lightPrimary dark:text-darkPrimary">
            DRE StockLogic
          </h1>
        </div>

        <div className="flex items-center gap-4">
        {/* <div className="h-8 w-8 rounded-full bg-lightPrimary dark:bg-darkPrimary text-white flex items-center justify-center font-medium">
            JD
          </div> */}

          <button
              onClick={toggleTheme}
            className="p-2 rounded-lg text-lightPrimary dark:text-darkPrimary hover:bg-lightPrimary/20 dark:hover:bg-darkPrimary/20 transition-colors"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded-lg text-lightPrimary dark:text-darkPrimary hover:bg-lightPrimary/20 dark:hover:bg-darkPrimary/20 transition-colors"
            aria-label="Log out"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
          
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;