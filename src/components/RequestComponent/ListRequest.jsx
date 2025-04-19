import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import RequestService from '../../services/RequestService';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';
import RoleBasedContent from '../context/RoleBasedContent';

const ListRequest = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const navigate = useNavigate();
  const { setIsLoading, isLoading } = useOutletContext();
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState('table');
  const effectRan = useRef(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedRows, setExpandedRows] = useState({}); // Added for expanded rows

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    site: '',
    userRole: '',
    userName: '',
    fromDate: '',
    toDate: '',
  });

  // Populate dropdowns
  const [uniqueSites, setUniqueSites] = useState([]);
  const [uniqueUserNames, setUniqueUserNames] = useState([]);
  const [uniqueUserRoles, setUniqueUserRoles] = useState([]);

  // Map header names to actual request object keys
  const headerToKeyMap = {
    'ID': 'id',
    'Site': 'site_name',
    'Requested By': 'requested_by',
    'Date': 'request_date',
    'Status': 'status',
  };

  // Set dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.style.backgroundColor = isDark ? '#000' : '';
  }, [isDark]);

  // Check screen size and adjust view mode
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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const userId = AuthService.getUserId();
        const roles = AuthService.getUserRoles();
        // If roles is an array, use its first element
        const roleStr = Array.isArray(roles) && roles.length > 0 ? roles[0] : roles;
        setCurrentUserRole(typeof roleStr === 'string' ? roleStr.toLowerCase() : '');
        
        const response = await RequestService.getRequestsList(userId);
        
        if (response.data?.data) {
          const all = response.data.data;
          setRequests(all);
          setFilteredRequests(all);

          setUniqueSites([...new Set(all.map(r => r.site_name).filter(Boolean))]);
          setUniqueUserNames([...new Set(all.map(r => r.requested_by).filter(Boolean))]);
          setUniqueUserRoles([
            ...new Set(
              all.map(r => {
                // Try to use r.user_role if available, otherwise extract from requested_by
                let role = r.user_role;
                if (!role && r.requested_by) {
                  const matches = r.requested_by.match(/\((.*?)\)/);
                  role = matches ? matches[1] : '';
                }
                return role.toLowerCase(); // Normalize to lowercase
              }).filter(Boolean)
            )
          ]);
        }
      } catch (error) {
        toast.error("Server Not Responding");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  // Filter logic
  useEffect(() => {
    const result = requests.filter(r => {
      const { search, site, userRole, userName, fromDate, toDate } = filters;
      const lowerSearch = search.toLowerCase();
  
      // Search functionality
      const matchesSearch = search ? (
        r.site_name?.toLowerCase().includes(lowerSearch) ||
        r.requested_by?.toLowerCase().includes(lowerSearch) ||
        (r.items?.some(item => item.material_name?.toLowerCase().includes(lowerSearch)))
      ) : true;
  
      // Site filter
      const matchesSite = site ? r.site_name === site : true;
  
      // Extract the role from the requested_by field if r.user_role is not provided
      let extractedRole = r.user_role;
      if (!extractedRole && r.requested_by) {
        const matches = r.requested_by.match(/\((.*?)\)/);
        extractedRole = matches ? matches[1] : '';
      }
      
      // Role filtering
      const matchesUserRole = userRole ? 
        extractedRole?.toLowerCase() === userRole.toLowerCase() : true;
      
      // User name filtering
      const matchesUserName = userName ? 
        r.requested_by?.includes(userName) : true;
  
      // Date filtering
      const reqDate = r.request_date ? parseISO(r.request_date) : null;
      const matchesFromDate = fromDate && reqDate ? (
        isAfter(reqDate, parseISO(fromDate)) ||
        format(reqDate, 'yyyy-MM-dd') === format(parseISO(fromDate), 'yyyy-MM-dd')
      ) : true;
      const matchesToDate = toDate && reqDate ? (
        isBefore(reqDate, parseISO(toDate)) ||
        format(reqDate, 'yyyy-MM-dd') === format(parseISO(toDate), 'yyyy-MM-dd')
      ) : true;
  
      return (
        matchesSearch &&
        matchesSite &&
        matchesUserRole &&
        matchesUserName &&
        matchesFromDate &&
        matchesToDate
      );
    });
  
    setFilteredRequests(result);
  }, [filters, requests]);

  // Handle sort
  const handleSort = (header) => {
    const key = headerToKeyMap[header];
    if (!key) return; // If header is not sortable, do nothing
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort filtered requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    // Special handling for request_date
    if (sortConfig.key === 'request_date') {
      const dateA = a[sortConfig.key] ? new Date(a[sortConfig.key]) : new Date(0);
      const dateB = b[sortConfig.key] ? new Date(b[sortConfig.key]) : new Date(0);
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    const valA = a[sortConfig.key] || '';
    const valB = b[sortConfig.key] || '';
    
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      site: '',
      userRole: '',
      userName: '',
      fromDate: '',
      toDate: '',
    });
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getForwardedStatus = (forwarded) => {
    return forwarded ? 
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const handleNewRequest = () => {
    navigate('/AddMaterialRequest');
  };

  // Table headers
  const tableHeaders = ['ID', 'Site', 'Requested By', 'Date', 'Status', 'Actions'];

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
        {/* Title and Toggle Button in same row for mobile */}
        <div className="w-full flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Material Requests
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

        {/* Filter Controls */}
        <div className="flex flex-col w-full sm:flex-row gap-3 sm:gap-2">
          {/* Search Input */}
          <input
            type="text"
            name="search"
            placeholder="Search requests..."
            className="flex-grow p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            value={filters.search}
            onChange={handleChange}
            disabled={isLoading}
          />

          {/* Admin filter dropdowns */}
          <RoleBasedContent allowedRoles={['admin']}>
            <select
              name="site"
              className="p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm transition-colors"
              value={filters.site}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">All Sites</option>
              {uniqueSites.map((site, idx) => (
                <option key={idx} value={site}>{site}</option>
              ))}
            </select>
          </RoleBasedContent>

          {/* Admin and Site Manager filter dropdowns */}
          <RoleBasedContent allowedRoles={['admin', 'sitemanager']}>
            <select
              name="userRole"
              className="p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm transition-colors"
              value={filters.userRole}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">All Roles</option>
              <option value="sitemanager">Site Manager</option>
              <option value="siteengineer">Site Engineer</option>
            </select>
          </RoleBasedContent>

          {/* Date filters */}
          <input
            type="date"
            name="fromDate"
            className="p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm transition-colors"
            value={filters.fromDate}
            onChange={handleChange}
            disabled={isLoading}
          />
          <input
            type="date"
            name="toDate"
            className="p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm transition-colors"
            value={filters.toDate}
            onChange={handleChange}
            disabled={isLoading}
          />
          
          {/* Reset filters button */}
          <button 
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={clearFilters}
            disabled={isLoading}
          >
            Reset
          </button>
          
          {/* New Request button for Site Manager and Engineer */}
          {(currentUserRole === 'sitemanager' || currentUserRole === 'siteengineer') && (
            <button 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNewRequest}
              disabled={isLoading}
            >
              New Request
            </button>
          )}
        </div>
      </div>

      {/* Table View */}
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
                      {headerToKeyMap[header] && sortConfig.key === headerToKeyMap[header] && (
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
                currentItems.flatMap((request) => {
                  const requestRow = (
                    <tr 
                      key={request.id} 
                      className="hover:bg-gray-50 dark:hover:bg-darkPrimary/10 cursor-pointer"
                      onClick={() => navigate(`/MaterialRequest/${request.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {request.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {request.site_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {request.requested_by}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {request.request_date ? format(parseISO(request.request_date), 'MM/dd/yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getForwardedStatus(request.forwarded_to_ho)}`}>
                          {request.forwarded_to_ho ? 'Forwarded to HO' : 'Pending Forwarding'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            aria-label="View"
                          >
                            
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRows(prev => ({ ...prev, [request.id]: !prev[request.id] }));
                            }}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            aria-label={expandedRows[request.id] ? "Collapse" : "Expand"}
                          >
                            {expandedRows[request.id] ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );

                  if (expandedRows[request.id]) {
                    const expandedRow = (
                      <tr key={`expanded-${request.id}`}>
                        <td colSpan={tableHeaders.length} className="p-4 bg-gray-50 dark:bg-darkSurface/50">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-darkPrimary/20">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Material Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-darkPrimary/20">
                                {request.items && request.items.length > 0 ? (
                                  request.items.map((item, index) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                        {item.material_name || 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                        {item.quantity || 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(item.status)}`}>
                                          {item.status || 'Pending'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                      No items found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    );
                    return [requestRow, expandedRow];
                  }
                  return [requestRow];
                })
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    No requests found
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
            currentItems.map((request) => (
              <div 
                key={request.id} 
                className="rounded-lg border border-gray-200 dark:border-darkPrimary/20 p-4 bg-white dark:bg-darkSurface"
               
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Request #{request.id}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Site: {request.site_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getForwardedStatus(request.forwarded_to_ho)}`}>
                    {request.forwarded_to_ho ? 'Forwarded to HO' : 'Pending Forwarding'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="mb-1">
                    <span className="font-medium">Requested by:</span> {request.requested_by}
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">Date:</span> {request.request_date ? format(parseISO(request.request_date), 'MM/dd/yyyy') : '-'}
                  </p>
                </div>
                
                {/* Materials summary */}
                {request.items && request.items.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkPrimary/10">
                    <p className="font-medium text-xs text-gray-700 dark:text-gray-300 mb-1">Materials:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400">
                      {request.items.slice(0, 2).map((item, index) => (
                        <li key={index} className="flex justify-between items-center py-1">
                          <span>{item.material_name}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(item.status)}`}>
                            {item.status || 'Pending'}
                          </span>
                        </li>
                      ))}
                      {request.items.length > 2 && (
                        <li className="text-xs italic text-gray-500 dark:text-gray-400">
                          +{request.items.length - 2} more items
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
              
              </div>
            ))
          ) : (
            <div className="text-center p-4 bg-white dark:bg-darkSurface rounded-lg border border-gray-200 dark:border-darkPrimary/20">
              <p className="text-gray-500 dark:text-gray-400">No requests found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 px-1">
        <div className="text-xs text-gray-600 dark:text-gray-400 order-2 sm:order-1">
          {sortedRequests.length > 0 ? 
            `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, sortedRequests.length)} of ${sortedRequests.length} entries` : 
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
    </div>
  );
};

export default ListRequest;