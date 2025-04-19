import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import ConsumptionService from '../../services/ConsumptionService';
import AuthService from '../../services/AuthService';
import RoleBasedContent from '../context/RoleBasedContent';

const ListConsumption = () => {
  const [consumptions, setConsumptions] = useState([]);
  const [filteredConsumptions, setFilteredConsumptions] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const navigate = useNavigate();
  const { setIsLoading, isLoading } = useOutletContext();
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState('table');
  const effectRan = useRef(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedRows, setExpandedRows] = useState({}); // For nested consumption items

  // Filter states – adjust as needed
  const [filters, setFilters] = useState({
    search: '',
    site: '',
    fromDate: '',
    toDate: '',
  });

  // For populating dropdowns, e.g., list of sites (if needed)
  const [uniqueSites, setUniqueSites] = useState([]);

  // Map table header names to consumption object keys.
  const headerToKeyMap = {
    'ID': 'id',
    'Date': 'date',
    'Site': 'site_name',
    'Remark': 'remark',
    'Created On': 'createdon',
  };

  // Set dark mode classes on the document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.style.backgroundColor = isDark ? '#000' : '';
  }, [isDark]);

  // Adjust view mode based on window width.
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch consumption records.
  useEffect(() => {
    const fetchData = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const userId = AuthService.getUserId();
        const roles = AuthService.getUserRoles();
        // Use the first role if an array is returned.
        const roleStr = Array.isArray(roles) && roles.length > 0 ? roles[0] : roles;
        setCurrentUserRole(typeof roleStr === 'string' ? roleStr.toLowerCase() : '');
        
        const response = await ConsumptionService.getConsumption(userId);
        if (response.data?.data) {
          const allData = response.data.data;
          setConsumptions(allData);
          setFilteredConsumptions(allData);

          // Populate unique sites for filtering, if needed.
          setUniqueSites([...new Set(allData.map(r => r.site_name).filter(Boolean))]);
        } else {
          toast.error("No consumption records found");
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

  // Filter logic (search on site_name and remark; date filtering based on 'date' field).
  useEffect(() => {
    const result = consumptions.filter(r => {
      const { search, site, fromDate, toDate } = filters;
      const lowerSearch = search.toLowerCase();

      // Search by site or remark
      const matchesSearch = search ? (
        r.site_name?.toLowerCase().includes(lowerSearch) ||
        r.remark?.toLowerCase().includes(lowerSearch)
      ) : true;

      // Site dropdown filter
      const matchesSite = site ? r.site_name === site : true;

      // Date filtering on the consumption date
      const recDate = r.date ? parseISO(r.date) : null;
      const matchesFromDate = fromDate && recDate ? (
        isAfter(recDate, parseISO(fromDate)) ||
        format(recDate, 'yyyy-MM-dd') === format(parseISO(fromDate), 'yyyy-MM-dd')
      ) : true;
      const matchesToDate = toDate && recDate ? (
        isBefore(recDate, parseISO(toDate)) ||
        format(recDate, 'yyyy-MM-dd') === format(parseISO(toDate), 'yyyy-MM-dd')
      ) : true;

      return matchesSearch && matchesSite && matchesFromDate && matchesToDate;
    });
    setFilteredConsumptions(result);
    setCurrentPage(1);
  }, [filters, consumptions]);

  // Sorting logic for consumption records.
  const sortedConsumptions = [...filteredConsumptions].sort((a, b) => {
    if (!sortConfig.key) return 0;

    // Handle date sorting specially.
    if (sortConfig.key === 'date' || sortConfig.key === 'createdon') {
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

  // Pagination calculations.
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedConsumptions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedConsumptions.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Input change handler for filters.
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      site: '',
      fromDate: '',
      toDate: '',
    });
  };

  // Toggle sort
  const handleSort = (header) => {
    const key = headerToKeyMap[header];
    if (!key) return; // If header is not sortable
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Navigate to new consumption record entry (only if allowed)
  const handleNewConsumption = () => {
    navigate('/consumptionform');
  };

  // Nested table status color (for consumption items, if you have a status field)
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // For consistency, you might not have forwarded status in consumption.
  // Instead, feel free to remove or adjust this function if not applicable.
  const getForwardedStatus = (forwarded) => {
    return forwarded ? 
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  // Table headers for consumption records.
  const tableHeaders = ['ID', 'Date', 'Site', 'Remark', 'Created On', 'Actions'];

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Material Consumption Records
          </h1>
          <RoleBasedContent allowedRoles={['siteengineer']}>
            <button
              onClick={handleNewConsumption}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              New Consumption
            </button>
          </RoleBasedContent>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-col w-full sm:flex-row gap-3 sm:gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search records..."
            className="flex-grow p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            value={filters.search}
            onChange={handleChange}
            disabled={isLoading}
          />
          {/* Dropdown for unique sites if available */}
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
        </div>
      </div>

      {/* Table View for Desktop */}
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
                currentItems.flatMap((record) => {
                  const recordRow = (
                    <tr 
                      key={record.id} 
                      className="hover:bg-gray-50 dark:hover:bg-darkPrimary/10 cursor-pointer"
                      onClick={() => navigate(`/MaterialConsumption/${record.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {record.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {record.date ? format(parseISO(record.date), 'MM/dd/yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {record.site_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {record.remark}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {record.createdon ? format(parseISO(record.createdon), 'MM/dd/yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            aria-label="View"
                          >
                            {/* Placeholder for view icon */}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRows(prev => ({ ...prev, [record.id]: !prev[record.id] }));
                            }}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            aria-label={expandedRows[record.id] ? "Collapse" : "Expand"}
                          >
                            {expandedRows[record.id] ? (
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
  
                  if (expandedRows[record.id]) {
                    const expandedRow = (
                      <tr key={`expanded-${record.id}`}>
                        <td colSpan={tableHeaders.length} className="p-4 bg-gray-50 dark:bg-darkSurface/50">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-darkPrimary/20">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Material Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Unit Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Unit Symbol
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-darkPrimary/20">
                                {record.items && record.items.length > 0 ? (
                                  record.items.map((item, index) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                        {item.material_name || 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                        {item.unit_name || 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                        {item.unit_symbol || 'N/A'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                        {item.quantity || 'N/A'}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
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
                    return [recordRow, expandedRow];
                  }
                  return [recordRow];
                })
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    No records found
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
            currentItems.map((record) => (
              <div 
                key={record.id} 
                className="rounded-lg border border-gray-200 dark:border-darkPrimary/20 p-4 bg-white dark:bg-darkSurface"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Record #{record.id}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Site: {record.site_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs`}>
                    {record.forwarded_to_ho ? 'Forwarded' : 'Pending'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="mb-1">
                    <span className="font-medium">Date:</span> {record.date ? format(parseISO(record.date), 'MM/dd/yyyy') : '-'}
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">Remark:</span> {record.remark}
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">Created On:</span> {record.createdon ? format(parseISO(record.createdon), 'MM/dd/yyyy') : '-'}
                  </p>
                </div>
                {record.items && record.items.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkPrimary/10">
                    <p className="font-medium text-xs text-gray-700 dark:text-gray-300 mb-1">Items:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400">
                      {record.items.slice(0, 2).map((item, index) => (
                        <li key={index} className="flex justify-between items-center py-1">
                          <span>{item.material_name}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(item.status)}`}>
                            {item.status || 'Pending'}
                          </span>
                        </li>
                      ))}
                      {record.items.length > 2 && (
                        <li className="text-xs italic text-gray-500 dark:text-gray-400">
                          +{record.items.length - 2} more items
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center p-4 bg-white dark:bg-darkSurface rounded-lg border border-gray-200 dark:border-darkPrimary/20">
              <p className="text-gray-500 dark:text-gray-400">No records found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 px-1">
        <div className="text-xs text-gray-600 dark:text-gray-400 order-2 sm:order-1">
          {sortedConsumptions.length > 0 ? 
            `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, sortedConsumptions.length)} of ${sortedConsumptions.length} entries` : 
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

export default ListConsumption;
