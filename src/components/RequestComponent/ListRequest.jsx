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
  const [expandedRows, setExpandedRows] = useState({});
  const roles = AuthService.getUserRoles();
  const roleStr = Array.isArray(roles) && roles.length > 0 ? roles[0] : roles;
  const [filters, setFilters] = useState({
    search: '',
    site: '',
    userRole: '',
    userName: '',
    fromDate: '',
    toDate: '',
  });

  const [uniqueSites, setUniqueSites] = useState([]);
  const [uniqueUserNames, setUniqueUserNames] = useState([]);
  const [uniqueUserRoles, setUniqueUserRoles] = useState([]);

  const headerToKeyMap = {
    'ID': 'id',
    'Site': 'site_name',
    'Requested By': 'requested_by',
    'Date': 'request_date',
    'Status': 'status',
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.style.backgroundColor = isDark ? '#000' : '';
  }, [isDark]);

  

  useEffect(() => {
    const fetchData = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const userId = AuthService.getUserId();
       
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
                let role = r.user_role;
                if (!role && r.requested_by) {
                  const matches = r.requested_by.match(/\((.*?)\)/);
                  role = matches ? matches[1] : '';
                }
                return role.toLowerCase();
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

  useEffect(() => {
    const result = requests.filter(r => {
      const { search, site, userRole, userName, fromDate, toDate } = filters;
      const lowerSearch = search.toLowerCase();

      const matchesSearch = search ? (
        r.site_name?.toLowerCase().includes(lowerSearch) ||
        r.requested_by?.toLowerCase().includes(lowerSearch) ||
        (r.items?.some(item => item.material_name?.toLowerCase().includes(lowerSearch)))
      ) : true;

      const matchesSite = site ? r.site_name === site : true;

      let extractedRole = r.user_role;
      if (!extractedRole && r.requested_by) {
        const matches = r.requested_by.match(/\((.*?)\)/);
        extractedRole = matches ? matches[1] : '';
      }

      const matchesUserRole = userRole ? 
        extractedRole?.toLowerCase() === userRole.toLowerCase() : true;

      const matchesUserName = userName ? 
        r.requested_by?.includes(userName) : true;

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

  const handleSort = (header) => {
    const key = headerToKeyMap[header];
    if (!key) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortConfig.key) return 0;

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
  const handleForwardToHO = async (requestId) => {
    try {
      const userId = AuthService.getUserId();
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }
  
      const isConfirmed = window.confirm('Are you sure you want to forward this request to Head Office?');
      if (!isConfirmed) return;
  
      const loadingToast = toast.loading('Forwarding request...');
      
      try {
        await RequestService.forwardToHO(requestId, userId);
        toast.success('Request forwarded successfully', { id: loadingToast });
        
        // Refresh requests instead of full page reload
        const refreshed = await RequestService.getRequestsList(userId);
        if (refreshed.data?.data) {
          setRequests(refreshed.data.data);
          setFilteredRequests(refreshed.data.data);
        }
      } catch (error) {
        console.error('Forward error:', error);
        toast.error(error.response?.data?.message || 'Failed to forward request', { id: loadingToast });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };
  const handleNewRequest = () => {
    navigate('/AddMaterialRequest');
  };
  
  
  const handleApprove = (requestId) => {
    if (roleStr === 'admin') {
      navigate(`/IssueMaterialToSiteForm/${requestId}`);
    }
    else if (roleStr === 'sitemanager') {
      navigate(`/IssueMaterialForm/${requestId}`);
    }
    else {
      alert("You don’t have permission to approve this request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      // Get user ID from auth service
      const userId = AuthService.getUserId();
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }
  
      // Simple confirmation dialog
      const isConfirmed = window.confirm('Are you sure you want to reject this request?');
      if (!isConfirmed) return;
  
      // Show loading state
      const loadingToast = toast.loading('Rejecting request...');
  
      // Execute rejection
      try {
        await RequestService.rejectRequest(requestId, userId);

        toast.success('Request rejected successfully', { id: loadingToast });
        const refreshed = await RequestService.getRequestsList(userId);
        
        
        

        if (refreshed.data?.data) {
          setRequests(refreshed.data.data);
          setFilteredRequests(refreshed.data.data);
        }
      } catch (error) {
        console.error('Rejection error:', error);
        toast.error(error.response?.data?.message || 'Failed to reject request', { id: loadingToast });
      }
  
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    }
  };
  

  
  const tableHeaders = ['ID', 'Site', 'Requested By', 'Date', 'Status', 'Actions'];

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Material Requests
          </h1>
  
        </div>

        <div className="flex flex-col w-full sm:flex-row gap-3 sm:gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search requests..."
            className="flex-grow p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            value={filters.search}
            onChange={handleChange}
            disabled={isLoading}
          />
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
          <button 
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={clearFilters}
            disabled={isLoading}
          >
            Reset
          </button>
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
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-darkPrimary/20"
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
                onClick={() =>
                  setExpandedRows(prev => ({
                    ...prev,
                    [request.id]: !prev[request.id]
                  }))
                }
              >
                {/* Table cells */}
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
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                        {/* Admin Actions */}
                        {roleStr === 'admin' && 
 request.forwarded_to_ho && 
 (request.status === "Pending" || request.status === "Forwarded To HO") && (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(request.id);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors dark:bg-red-500 dark:hover:bg-red-600"
                              >
                                Reject
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(request.id);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors dark:bg-green-500 dark:hover:bg-green-600"
                              >
                                Approve
                              </button>
                            </div>
                          )}

{roleStr === 'sitemanager' &&  (  // Changed to currentUser.siteid
                              <div className="flex items-center gap-3">
                                {(request.status === "Pending" || request.status === "Fulfilled To Site"  ) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(request.id);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors dark:bg-red-500 dark:hover:bg-red-600"
                                  >
                                    Reject
                                  </button>
                                )}

                                {/* Approve Button - for Pending or Issued to Site */}
                                {(request.status === "Pending" || request.status === "Fulfilled To Site") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(request.id);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors dark:bg-green-500 dark:hover:bg-green-600"
                                  >
                                    Approve
                                  </button>
                                )}

                                {/* Forward to HO Button - only for Pending */}
                                {request.status === "Pending" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleForwardToHO(request.id);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                                  >
                                    Forward To HO
                                  </button>
                                )}
                              </div>
                            )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRows(prev => ({ ...prev, [request.id]: !prev[request.id] }));
                            }}
                            className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 dark:bg-darkPrimary/20 dark:hover:bg-darkPrimary/30 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
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
                        {/* REMARK SECTION */}
                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                          Remark: {request.remark || '-'}
                        </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-darkPrimary/20">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Material Name
                                  </th>
                                
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Unit
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Quantity
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
                                        {item.unit_name || 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                        {item.quantity || 'N/A'}
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