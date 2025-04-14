import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import UserService from '../../services/UserService';
import AddUserModal from './AddUserModel';
// import EditUserModal from './EditUserModal';
import AuthService from '../../services/AuthService';
import autoprefixer from 'autoprefixer';
import RoleBasedContent from '../context/RoleBasedContent';

const ListUser = () => {
  const [users, setUsers] = useState([]);
  const { setIsLoading, isLoading } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  // New filter state: selectedSite and selectedRole (default "all")
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const userId = AuthService.getUserId();
  const [selectedUser, setSelectedUser] = useState(null);
  const { isDark } = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const effectRan = useRef(false);
  const itemsPerPage = 10;

  // Map header names to actual user object keys
  const headerToKeyMap = {
    id: 'id',
    Username: 'username',
    SiteName: 'siteName',
    Role: 'role',
    Phone: 'phone',
    // "actions" is not mapped since you probably don't want sorting on it
  };

  // Fetch users data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const response = await UserService.getUserList(userId);
        setUsers(response.data.data);
      } catch (error) {
        toast.error("Server Not Responding");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  // Set dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.style.backgroundColor = isDark ? '#000' : '';
  }, [isDark]);

  // Check screen size and adjust view mode accordingly
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update handleSort to use headerToKeyMap
  const handleSort = (header) => {
    const key = headerToKeyMap[header];
    if (!key) return; // If header is "actions", do nothing
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // Get unique site names for the dropdown options
  const uniqueSites = Array.from(new Set(users.map(user => user.siteName).filter(Boolean)));

  // Filter users based on search query, site dropdown and role dropdown
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = Object.values(user).some(value =>
      value.toString().toLowerCase().includes(query)
    );

    const matchesSite = selectedSite === 'all' || user.siteName === selectedSite;
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;

    return matchesSearch && matchesSite && matchesRole;
  });

  // Sort filtered users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Table headers
  const tableHeaders = ['id', 'Username', 'SiteName', 'Role', 'Phone', 'actions'];

  // Helper function to format role text
  const formatRole = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'sitemanager':
        return 'Site Manager';
      case 'siteengineer':
        return 'Site Engineer';
      default:
        return role;
    }
  };

  // Helper function to get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'sitemanager':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'siteengineer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
        {/* Title and Toggle Button in same row for mobile */}
        <div className="w-full flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Users Management
          </h1>
          {/* View toggle for mobile - now inline with title */}
          <div className="sm:hidden flex">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 dark:bg-darkSurface/50 dark:hover:bg-darkSurface/70 px-3 py-1.5 rounded-md border border-gray-200 dark:border-darkPrimary/20 transition-colors duration-200"
            >
              {viewMode === 'table' ? (
                <>
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Card View
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Table View
                </>
              )}
            </button>
          </div>
        </div>

        {/* Controls for search and filter dropdowns */}
      
          {/* Dropdown for Site Filter */}
          <RoleBasedContent allowedRoles={['admin']}>
          <select
              className="p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm transition-colors"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              disabled={isLoading}
              >
              <option value="all">All Sites</option>
              {uniqueSites.map((site, index) => (
                <option key={index} value={site}>
                  {site}
                </option>
              ))}
          </select>
          {/* Dropdown for Role Filter */}
          <select
            className="p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm transition-colors"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isLoading}
          >
            <option value="all">All Roles</option>
            <option value="sitemanager">Site Manager</option>
            <option value="siteengineer">Site Engineer</option>
          </select>
          </RoleBasedContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Users..."
            className="flex-grow p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
           <RoleBasedContent allowedRoles={['admin']}>
           <button 
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setSelectedSite('all');
              setSelectedRole('all');
              setSearchQuery('');
            }}
            disabled={isLoading}
          >
            Reset
          </button>
          </RoleBasedContent>
          <button 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading}
          >
            Add User
          </button>
         
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-darkPrimary/20">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-darkPrimary/20">
            <thead className="bg-gray-50 dark:bg-darkSurface/50">
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    onClick={() => handleSort(header)}
                    className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-darkPrimary/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{header}</span>
                      {sortConfig.key === headerToKeyMap[header] && (
                        <span className="ml-1.5 text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-darkSurface divide-y divide-gray-200 dark:divide-darkPrimary/20">
              {currentItems.length > 0 ? (
                currentItems.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-darkPrimary/10 cursor-pointer ${selectedUser && selectedUser.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-3 border-blue-500 dark:border-blue-400' : ''}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.username}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.siteName || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          aria-label="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View for Mobile */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-4">
          {currentItems.length > 0 ? (
            currentItems.map((user) => (
              <div 
                key={user.id} 
                className={`rounded-lg border p-4 ${
                  selectedUser && selectedUser.id === user.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-darkPrimary/20 bg-white dark:bg-darkSurface'
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{user.username}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                    {formatRole(user.role)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="mb-1"><span className="font-medium">Phone:</span> {user.phone}</p>
                  <p className="mb-1"><span className="font-medium">Site:</span> {user.siteName || '-'}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkPrimary/10 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditUser(user);
                    }}
                    className="rounded-md bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 bg-white dark:bg-darkSurface rounded-lg border border-gray-200 dark:border-darkPrimary/20">
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 px-1">
        <div className="text-xs text-gray-600 dark:text-gray-400 order-2 sm:order-1">
          {sortedUsers.length > 0 ? 
            `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, sortedUsers.length)} of ${sortedUsers.length} entries` : 
            'No entries to show'}
        </div>
        <div className="flex gap-2 order-1 sm:order-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1.5 text-xs border rounded-md disabled:opacity-50 hover:bg-gray-50 dark:border-darkPrimary/20 dark:hover:bg-darkPrimary/10 dark:text-gray-100"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
            className="px-3 py-1.5 text-xs border rounded-md disabled:opacity-50 hover:bg-gray-50 dark:border-darkPrimary/20 dark:hover:bg-darkPrimary/10 dark:text-gray-100"
          >
            Next
          </button>
        </div>
      </div>

      <AddUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newUser) => {
          setUsers(prev => [newUser, ...prev]);
          toast.success(`User Created Successfully`);
        }}
        onError={(message) => {
          toast.error(message);
          console.error(message);
        }}
      />

      {/*
      <EditUserModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={(updatedUser) => {
          setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user));
          toast.success(`Updated Successfully`);
        }}
        onError={(message) => {
          toast.error(message);
        }}
        user={editingUser}
      />
      */}
    </div>
  );
};

export default ListUser;
