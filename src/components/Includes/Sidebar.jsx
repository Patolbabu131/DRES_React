import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile, activeNav, setActiveNav, navigation }) => {
  return (
    <aside
      className={`fixed top-14 h-[calc(100vh-3rem)] z-30 bg-white/95 dark:bg-darkSurface/95 backdrop-blur-sm border-r border-lightPrimary/20 dark:border-darkPrimary/20 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-48'
      } ${isMobile ? (isCollapsed ? '-translate-x-full' : 'translate-x-0') : ''}`}
    >
      <div className="h-full overflow-y-auto py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <div key={item.segment} className="relative group">
              <Link
                to={item.path}
                onClick={() => setActiveNav(item.segment)}
                className={`w-auto flex items-center p-3 mx-2 rounded-lg transition-colors ${
                  activeNav === item.segment
                    ? 'bg-lightPrimary/20 dark:bg-darkPrimary/20 text-lightPrimary dark:text-darkPrimary'
                    : 'text-gray-800 dark:text-gray-200 hover:bg-lightPrimary/10 dark:hover:bg-darkPrimary/10'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
              </Link>

              {item.children && !isCollapsed && (
                <div className="ml-8 pl-2 border-l-2 border-lightPrimary/20 dark:border-darkPrimary/20">
                  {item.children.map((child) => (
                    <Link
                      key={child.segment}
                      to={child.path}
                      onClick={() => setActiveNav(child.segment)}
                      className={`w-auto flex items-center p-2 rounded-lg transition-colors ${
                        activeNav === child.segment
                          ? 'bg-lightPrimary/20 dark:bg-darkPrimary/20 text-lightPrimary dark:text-darkPrimary'
                          : 'text-gray-800 dark:text-gray-200 hover:bg-lightPrimary/10 dark:hover:bg-darkPrimary/10'
                      }`}
                    >
                      <span className="text-xl">{child.icon}</span>
                      <span className="ml-3 text-sm">{child.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {isCollapsed && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:block bg-darkSurface text-darkPrimary text-sm px-2 py-1 rounded-md ml-2 shadow-lg border border-darkPrimary/20">
                  {item.name}
                </div>
              )}
            </div>
          ))}
        </nav>

        {!isMobile && (
          <div className="absolute bottom-4 w-full px-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-fit flex items-center justify-center p-2 text-lightPrimary dark:text-darkPrimary hover:bg-lightPrimary/20 dark:hover:bg-darkPrimary/20 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <FiChevronRight className="w-5 h-5" />
              ) : (
                <FiChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;