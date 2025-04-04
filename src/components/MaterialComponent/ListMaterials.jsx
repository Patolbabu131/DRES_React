import { useState, useEffect, useRef } from 'react';
import MaterialService from '../../services/MaterialService';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AddMaterialModal from './AddMaterialModal';
import toast, { Toaster } from 'react-hot-toast';
import EditMaterialModal from './EditMaterialModal';

const ListMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const { setIsLoading, isLoading } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark } = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const effectRan = useRef(false);
  const itemsPerPage = 10;

  // Fetch materials data
  useEffect(() => {
    const fetchData = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const response = await MaterialService.getAllMaterials();
        setMaterials(response.data.data);
      } catch (error) {
        toast.error("Server not responding");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  // Dark mode setup
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.style.backgroundColor = isDark ? '#000' : '';
  }, [isDark]);

  // Responsive view mode
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

  const handleDeleteMaterial = async (materialId) => {
    const confirmed = await new Promise((resolve) => {
      const customToastId = toast.custom(
        (t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
            max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black/10 dark:ring-white/10 p-4`}>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Delete Material Confirmation
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this material? This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                  onClick={() => resolve(true)}
                >
                  Delete Material
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium rounded-md bg-gray-50 text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-colors"
                  onClick={() => resolve(false)}
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
      await MaterialService.deleteMaterial(materialId);
      toast.success("Material deleted successfully", { containerId: 'notifications' });
      setMaterials(prev => prev.filter(m => m.id !== materialId));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message, { containerId: 'notifications' });
    }
  };

  // Filtering and sorting
  const filteredMaterials = materials.filter(material => {
    const query = searchQuery.toLowerCase();
    return Object.values(material).some(value =>
      value.toString().toLowerCase().includes(query)
    );
  });

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedMaterials.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage);

  const tableHeaders = ['id', 'material_name', 'remark', 'actions'];

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Materials Management
          </h1>
          <div className="sm:hidden flex">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 dark:bg-darkSurface/50 dark:hover:bg-darkSurface/70 px-3 py-1.5 rounded-md border border-gray-200 dark:border-darkPrimary/20 transition-colors"
            >
              {viewMode === 'table' ? 'Card View' : 'Table View'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Materials..."
            className="flex-grow p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
            onClick={() => setIsModalOpen(true)}
          >
            Add Material
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
                    className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-darkPrimary/20"
                  >
                    <div className="flex items-center justify-between">
                      {header}
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
              {currentItems.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-darkPrimary/10">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{material.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{material.material_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {material.remark || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingMaterial(material);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-label="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-4">
          {currentItems.map((material) => (
            <div key={material.id} className="rounded-lg border p-4 bg-white dark:bg-darkSurface border-gray-200 dark:border-darkPrimary/20">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{material.material_name}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">ID: {material.id}</span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p>Remark: {material.remark || '-'}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkPrimary/10 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingMaterial(material);
                    setIsEditModalOpen(true);
                  }}
                  className="text-blue-600 dark:text-blue-400"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMaterial(material.id)}
                  className="text-red-600 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedMaterials.length)} of {sortedMaterials.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-darkPrimary/10"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-xs">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-darkPrimary/10"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
     <EditMaterialModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        material={editingMaterial}
        onSuccess={(updated) => {
          setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
        }}
      /> 
      
       <AddMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newMaterial) => {
          setMaterials(prev => [newMaterial, ...prev]);
        }}
      /> 
    </div>
  );
};

export default ListMaterials;