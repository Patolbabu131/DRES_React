import { useState, useEffect, useRef } from 'react';
import ApiClient from '../../services/SupplerService';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AddSupplierModal from './AddSupplierModal';
import EditSupplierModal from './EditSupplierModal';
import toast from 'react-hot-toast';

const ListSupplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const { setIsLoading, isLoading } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const { isDark } = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const effectRan = useRef(false);
  const itemsPerPage = 10;

  // Define columns with labels and keys (Actions has no key for sorting)
  const columns = [
    { label: 'ID', key: 'id' },
    { label: 'GST', key: 'gst' },
    { label: 'Company Name', key: 'company_name' },
    { label: 'Contact Name', key: 'contact_name' },
    { label: 'Phone', key: 'phone1' },
    { label: 'Address', key: 'address' },
    { label: 'Actions', key: null },
  ];

  // Fetch supplier data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const response = await ApiClient.getAllSupplier();
        // Assuming API response structure:
        // { message: "Success", data: [ { id, company_name, contact_name, gst, phone1, phone2, address, transactions } ] }
        setSuppliers(response.data.data);
      } catch (error) {
        toast.error("Server not responding");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  // Toggle dark mode classes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.style.backgroundColor = isDark ? '#000' : '';
  }, [isDark]);

  // Adjust view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Edit supplier
  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setIsEditModalOpen(true);
  };

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(supplier => {
    const query = searchQuery.toLowerCase();
    return Object.values(supplier).some(value =>
      value?.toString().toLowerCase().includes(query)
    );
  });

  // Sort filtered suppliers with null/undefined treated as blank
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] ?? '';
    const bValue = b[sortConfig.key] ?? '';
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Suppliers Management
          </h1>
          {/* Toggle view button for mobile */}
          <div className="sm:hidden flex">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 dark:bg-darkSurface/50 dark:hover:bg-darkSurface/70 px-3 py-1.5 rounded-md border border-gray-200 dark:border-darkPrimary/20 transition-colors duration-200"
            >
              {viewMode === 'table' ? (
                <>
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Card View
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
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
            placeholder="Search Suppliers..."
            className="flex-grow p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
          <button 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading}
          >
            Add Supplier
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-darkPrimary/20">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-darkPrimary/20">
            <thead className="bg-gray-50 dark:bg-darkSurface/50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.label}
                    onClick={() => {
                      if (col.key) handleSort(col.key);
                    }}
                    className={`px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-darkPrimary/20 ${!col.key ? 'cursor-default' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{col.label}</span>
                      {col.key && sortConfig.key === col.key && (
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
                currentItems.map((supplier) => (
                  <tr 
                    key={supplier.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-darkPrimary/10 cursor-pointer ${selectedSupplier && selectedSupplier.id === supplier.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-3 border-blue-500 dark:border-blue-400' : ''}`}
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.gst || ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.company_name || ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.contact_name || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.phone1 || ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{supplier.address || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSupplier(supplier);
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
                  <td colSpan={columns.length} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    No suppliers found
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
            currentItems.map((supplier) => (
              <div 
                key={supplier.id} 
                className={`rounded-lg border p-4 ${selectedSupplier && selectedSupplier.id === supplier.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-darkPrimary/20 bg-white dark:bg-darkSurface'}`}
                onClick={() => setSelectedSupplier(supplier)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {supplier.id}</p>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{supplier.company_name || ''}</h3>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="mb-1"><span className="font-medium">GST:</span> {supplier.gst || ''}</p>
                  <p className="mb-1"><span className="font-medium">Contact:</span> {supplier.contact_name || ''}</p>
                  <p className="mb-1"><span className="font-medium">Phone:</span> {supplier.phone1 || ''}</p>
                  <p className="mb-1"><span className="font-medium">Address:</span> {supplier.address || ''}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkPrimary/10 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSupplier(supplier);
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
              <p className="text-gray-500 dark:text-gray-400">No suppliers found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 px-1">
        <div className="text-xs text-gray-600 dark:text-gray-400 order-2 sm:order-1">
          {sortedSuppliers.length > 0 ? 
            `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, sortedSuppliers.length)} of ${sortedSuppliers.length} entries` : 
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
      <EditSupplierModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSupplier(null);
        }}
        onSuccess={(updatedSupplier) => {
          setSuppliers(prevSuppliers => prevSuppliers.map(supplier => supplier.id === updatedSupplier.id ? updatedSupplier : supplier));
          toast.success(`Updated Successfully`);
        }}
        onError={(message) => {
          toast.error(message);
        }}
        supplier={editingSupplier}
      /> 
       
      <AddSupplierModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newSupplier) => {
          setSuppliers(prev => [newSupplier, ...prev]);
          toast.success(`Supplier Created Successfully`);
        }}
        onError={(message) => {
          toast.error(message);
          console.error(message);
        }}
      />
    </div>
  );
};

export default ListSupplier;
