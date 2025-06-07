import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import { Toaster, toast } from 'react-hot-toast';
import { RiCheckLine, RiCloseLine } from 'react-icons/ri';
import { AuthService } from '../../services/AuthService'; // Import AuthService

import { 
  RiDashboardLine, 
  RiShoppingCartLine, 
  RiBarChartLine, 
  RiStackLine,
  RiUserLine,
  RiBuildingLine,
  RiContactsLine,
  RiRulerLine,
  RiStoreLine ,
  RiArchiveLine,
  RiStockLine ,RiBox2Line , RiPaletteLine,  
  RiStore2Line,
  RiShoppingBagLine,
  RiShoppingBagFill,
  RiShoppingBasketLine,
  RiShoppingBasketFill,
  RiStackFill,RiSendPlaneLine ,RiFileListLine ,RiClipboardLine ,
  RiScissorsCutLine ,RiBarChartBoxLine ,RiFlashlightLine,  
  RiNotificationLine ,RiMessageLine ,RiAlarmWarningLine ,RiMegaphoneLine 
} from 'react-icons/ri';
import { HiDocumentText } from 'react-icons/hi';

const Layout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [activeNav, setActiveNav] = useState('dashboard');
  const { isDark } = useTheme();

  // Get the roles from AuthService
  const roles = AuthService.getUserRoles();
  const hasRole = (role) => roles.includes(role); // Function to check if the user has a specific role

  const navigation = [
    { name: 'Dashboard', icon: <RiDashboardLine />, segment: 'dashboard', path: '/dashboard', roles: ['admin', 'sitemanager', 'siteengineer']  },
    { name: 'Stock', icon: <RiStackFill />, segment: 'stock', path: '/stock', roles: ['admin', 'sitemanager', 'siteengineer'] },
    { name: 'Sites', icon: <RiBuildingLine />, segment: 'site', path: '/site', roles: ['admin', 'sitemanager'] },
    { name: 'User', icon: <RiUserLine />, segment: 'user', path: '/user', roles: ['admin', 'sitemanager'] },
    { name: 'Supplier', icon: <RiContactsLine />, segment: 'supplier', path: '/supplier', roles: ['admin'] },
    { name: 'Unittype', icon: <RiRulerLine />, segment: 'unittype', path: '/unittype', roles: ['admin'] },
    { name: 'Material', icon: <RiArchiveLine />, segment: 'materials', path: '/material', roles: ['admin'] },
    { name: 'Request', icon: <RiSendPlaneLine />, segment: 'request', path: '/listrequest', roles: ['admin', 'sitemanager', 'siteengineer'] },
    { name: 'Consumption', icon: <RiScissorsCutLine />, segment: 'consumption', path: '/consumption', roles: ['admin', 'sitemanager', 'siteengineer'] },
    // { name: 'Push Notification', icon: <RiMegaphoneLine />, segment: 'Notification', path: '/template', roles: ['admin', 'sitemanager'] },
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true; // Show items without roles to everyone
    return item.roles.some((role) => hasRole(role)); // Check if user has at least one required role
  });

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobile(isMobile);
      setIsCollapsed(isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <div className="min-h-screen bg-lightBackground text-gray-900 dark:bg-darkBackground dark:text-gray-100 transition-colors duration-200">
      <Navbar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
        className="border-b border-lightPrimary/10 dark:border-darkPrimary/20"
      />
      <Toaster
        position="top-center"
        containerStyle={{ marginTop: '10px' }}
        toastOptions={{
          duration: 3000,
          style: {
            background: isDark ? '#1f2937' : '#f8fafc',
            color: isDark ? '#f9fafb' : '#0f172a',
            borderRadius: '8px',
            padding: '12px 16px',
            border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
          },
          success: {
            style: {
              borderLeft: `4px solid ${isDark ? '#059669' : '#16a34a'}`,
              background: isDark ? '#1f2937' : '#f0fdf4',
            },
            iconTheme: {
              primary: isDark ? '#10b981' : '#16a34a',
              secondary: isDark ? '#1f2937' : '#f0fdf4',
            },
          },
          info: {
            style: {
              borderLeft: `4px solid ${isDark ? '#60a5fa' : '#3b82f6'}`,
              background: isDark ? '#1f2937' : '#f0f9ff',
            },
            iconTheme: {
              primary: isDark ? '#93c5fd' : '#60a5fa',
              secondary: isDark ? '#1f2937' : '#f0f9ff',
            },
          },
          error: {
            style: {
              borderLeft: `4px solid ${isDark ? '#dc2626' : '#b91c1c'}`,
              background: isDark ? '#1f2937' : '#fef2f2',
            },
            iconTheme: {
              primary: isDark ? '#ef4444' : '#b91c1c',
              secondary: isDark ? '#1f2937' : '#fef2f2',
            },
          },
        }}
      />

      <Sidebar
        navigation={filteredNavigation}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        className="border-r border-lightPrimary/10 dark:border-darkPrimary/20"
      />

      <main className={`pt-16 transition-spacing duration-300 ease-in-out ${isCollapsed && !isMobile ? 'md:ml-16' : 'md:ml-48'} relative bg-lightBackground dark:bg-darkBackground`}>
        {isLoading && (
          <div className="absolute inset-0 bg-lightSurface/50 dark:bg-darkSurface/50 z-20 flex items-center justify-center backdrop-[1px]">
            <div className="w-12 h-12 border-4 border-lightSecondary/30 dark:border-darkSecondary/30 border-t-lightPrimary dark:border-t-darkPrimary rounded-full animate-spin" />
          </div>
        )}
        <div className="px-0.4 md:px-6 pt-1 pb-6 max-w-7xl mx-auto">
          <Outlet context={{ isLoading, setIsLoading }} />
        </div>
      </main>

      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </div>
  );
};
export default Layout;
