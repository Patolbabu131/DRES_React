import { useState, useEffect, useRef } from 'react';
import ApiClient from '../../services/ApiClient';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AddSiteModal from './AddSiteModal';
import toast, { Toaster } from 'react-hot-toast';
import EditSiteModal from './EditSiteModal';
import RoleBasedContent from '../context/RoleBasedContent';

const ListSite = () => {
  const [sites, setSites] = useState([]);
  const { setIsLoading, isLoading } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const { isDark } = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const effectRan = useRef(false);
  const itemsPerPage = 10;

  // Fetch sites data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const response = await ApiClient.getAllSites();
        setSites(response.data.data);
      } catch (error) {
        toast.error("Server not responding");
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    setIsEditModalOpen(true);
  };

  const handleDeleteSite = async (siteId) => {
    const confirmed = await new Promise((resolve) => {
      const customToastId = toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black/10 dark:ring-white/10 p-4`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Delete Site Confirmation
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this site? This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                  onClick={() => {
                    resolve(true);
                    toast.dismiss(customToastId);
                  }}
                >
                  Delete Site
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium rounded-md bg-gray-50 text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                  onClick={() => {
                    resolve(false);
                    toast.dismiss(customToastId);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ),
        {
          containerId: 'confirmations'
        }
      );
    });
  
    if (!confirmed) return;
    
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(1000);
    
    try {
      const response = await ApiClient.deleteSite(siteId);
      toast.success(response.data.message || "Site deleted successfully", {
        containerId: 'notifications',
        duration: 3000
      });
      setSites((prevSites) => prevSites.filter((site) => site.id !== siteId));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message, {
        containerId: 'notifications',
        duration: 3000,
      });
      console.error("Delete error:", error);
    }
  };

  // Filter sites based on search query
  const filteredSites = sites.filter(site => {
    const query = searchQuery.toLowerCase();
    return Object.values(site).some(value =>
      value.toString().toLowerCase().includes(query)
    );
  });

  // Sort filtered sites
  const sortedSites = [...filteredSites].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSites.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSites.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Table headers
  const tableHeaders = ['id', 'sitename', 'location', 'status', 'description', 'actions'];

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
    {/* Header and Controls */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
      {/* Title and Toggle Button in same row for mobile */}
      <div className="w-full flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
          Sites Management
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

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
      <input
        type="text"
        placeholder="Search Sites..."
        className="flex-grow p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={isLoading}
      />
        <RoleBasedContent allowedRoles={['admin']}>
      <button 
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setIsModalOpen(true)}
        disabled={isLoading}
      >
        Add Site
      </button>
      </RoleBasedContent>
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
                      {sortConfig.key === header && (
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
                currentItems.map((site) => (
                  <tr 
                    key={site.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-darkPrimary/10 cursor-pointer ${selectedSite && selectedSite.id === site.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-3 border-blue-500 dark:border-blue-400' : ''}`}
                    onClick={() => setSelectedSite(site)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{site.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{site.sitename}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {`${site.siteaddress}, ${site.state}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${site.status === 'active' || site.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {site.status === 'active' ? 'Active' : site.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {site.description ? site.description : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSite(site);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          aria-label="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSite(site.id);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          aria-label="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 3v1H4v2h16V4h-5V3H9zm-4 6v10a2 2 0 002 2h10a2 2 0 002-2V9H5zm4 3h2v6H9v-6zm4 0h2v6h-2v-6z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    No sites found
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
            currentItems.map((site) => (
              <div 
                key={site.id} 
                className={`rounded-lg border p-4 ${
                  selectedSite && selectedSite.id === site.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-darkPrimary/20 bg-white dark:bg-darkSurface'
                }`}
                onClick={() => setSelectedSite(site)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{site.sitename}</h3>
                    {/* <p className="text-xs text-gray-500 dark:text-gray-400">ID: {site.id}</p> */}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    site.status === 'active' || site.status === 'Active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {site.status === 'active' ? 'Active' : site.status}
                  </span>
                </div>
                
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="mb-1"><span className="font-medium">Location:</span> {`${site.siteaddress}, ${site.state}`}</p>
                  {site.description && (
                    <p className="mb-1"><span className="font-medium">Description:</span> {site.description}</p>
                  )}
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkPrimary/10 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSite(site);
                    }}
                    className="rounded-md bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSite(site.id);
                    }}
                    className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 bg-white dark:bg-darkSurface rounded-lg border border-gray-200 dark:border-darkPrimary/20">
              <p className="text-gray-500 dark:text-gray-400">No sites found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 px-1">
        <div className="text-xs text-gray-600 dark:text-gray-400 order-2 sm:order-1">
          {sortedSites.length > 0 ? 
            `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, sortedSites.length)} of ${sortedSites.length} entries` : 
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

      {/* Modals */}
      <EditSiteModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSite(null);
        }}
        onSuccess={(updatedSite) => {
          setSites(prevSites => prevSites.map(site => site.id === updatedSite.id ? updatedSite : site));
          toast.success(`Updated Successfully`);
        }}
        onError={(message) => {
          toast.error(message);
        }}
        site={editingSite}
      />
      
      <AddSiteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newSite) => {
          setSites(prev => [newSite, ...prev]);
          toast.success(`Site Created Successfully`);
        }}
        onError={(message) => {
          toast.error(message);
          console.error(message);
        }}
      />
    </div>
  );
};

export default ListSite;