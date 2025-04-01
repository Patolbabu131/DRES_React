import { useState, useEffect, useRef } from 'react';
import UnitService from '../../services/UnitService';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
 import AddUnitModal from './AddUnitModal';
import toast, { Toaster } from 'react-hot-toast';
// import EditUnitModal from './EditUnitModal';

const ListUnits = () => {
  const [units, setUnits] = useState([]);
  const { setIsLoading, isLoading } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const { isDark } = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const effectRan = useRef(false);
  const itemsPerPage = 10;

  // Fetch units data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const response = await UnitService.getAllUnits();
        setUnits(response.data.data);
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

  // Check screen size and adjust view mode
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setIsEditModalOpen(true);
  };

  const handleDeleteUnit = async (unitId) => {
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
                Delete Unit Confirmation
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this unit? This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                  onClick={() => {
                    resolve(true);
                    toast.dismiss(customToastId);
                  }}
                >
                  Delete Unit
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
        { containerId: 'confirmations' }
      );
    });

    if (!confirmed) return;
    
    try {
      const response = await UnitService.deleteUnit(unitId);
      toast.success(response.data.message || "Unit deleted successfully", {
        containerId: 'notifications',
        duration: 3000
      });
      setUnits((prevUnits) => prevUnits.filter((unit) => unit.id !== unitId));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message, {
        containerId: 'notifications',
        duration: 3000,
      });
      console.error("Delete error:", error);
    }
  };

  // Filter and sort units
  const filteredUnits = units.filter(unit => {
    const query = searchQuery.toLowerCase();
    return Object.values(unit).some(value =>
      value.toString().toLowerCase().includes(query)
    );
  });

  const sortedUnits = [...filteredUnits].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUnits.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUnits.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Table headers
  const tableHeaders = ['id', 'unitname', 'unitsymbol'];

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Units Management
          </h1>
          
          <div className="sm:hidden flex">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 dark:bg-darkSurface/50 dark:hover:bg-darkSurface/70 px-3 py-1.5 rounded-md border border-gray-200 dark:border-darkPrimary/20 transition-colors duration-200"
            >
              {viewMode === 'table' ? 'Card View' : 'Table View'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Units..."
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
            Add Unit
          </button>
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
                currentItems.map((unit) => (
                  <tr 
                    key={unit.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-darkPrimary/10 cursor-pointer ${selectedUnit?.id === unit.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-3 border-blue-500' : ''}`}
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{unit.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{unit.unitname}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{unit.unitsymbol}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    No units found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-4">
          {currentItems.map((unit) => (
            <div 
              key={unit.id}
              className={`rounded-lg border p-4 ${
                selectedUnit?.id === unit.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-darkPrimary/20 bg-white dark:bg-darkSurface'
              }`}
              onClick={() => setSelectedUnit(unit)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{unit.unitname}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Symbol: {unit.unitsymbol}</p>
                </div>
              </div>
              
              
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 px-1">
        <div className="text-xs text-gray-600 dark:text-gray-400 order-2 sm:order-1">
          {sortedUnits.length > 0 ? 
            `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, sortedUnits.length)} of ${sortedUnits.length} entries` : 
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
      {/* <EditUnitModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUnit(null);
        }}
        onSuccess={(updatedUnit) => {
          setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
          toast.success(`Unit Updated Successfully`);
        }}
        onError={(message) => toast.error(message)}
        unit={editingUnit}
      /> */}
      
     <AddUnitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newUnit) => {
          setUnits(prev => [newUnit, ...prev]);
         
        }}
        onError={(message) => toast.error(message)}
      /> 
    </div>
  );
};

export default ListUnits;