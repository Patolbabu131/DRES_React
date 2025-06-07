import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import TransactionService from '../../services/TransactionService';
import AuthService from '../../services/AuthService';
import { Eye, Download, Plus, Minus } from 'lucide-react';
import VoucherService from '../../services/VoucherService';
import VoucherModal from './VoucherModal';
import { useNavigate } from 'react-router-dom';

const TransactionHistoryDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const { setIsLoading, isLoading } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState('all');
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const { isDark } = useTheme();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [downloadingVoucher, setDownloadingVoucher] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [userRoles, setUserRoles] = useState([]);
  const effectRan = useRef(false);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  // Map header names to actual transaction object keys
  const headerToKeyMap = {
    VoucherNo: 'voucherNo',
    Type: 'transactionType',
    SiteName: 'siteName',
    Date: 'date',
    // "actions" is not mapped since you probably don't want sorting on it
  };

  const extractId = voucherNo => {
    const parts = voucherNo.split('-');
    if (parts.length > 1) return parts[1];
    const match = voucherNo.match(/\d+/);
    return match ? match[0] : voucherNo;
  };

  const handleView = async tx => {
    const id = extractId(tx.voucherNo);
    let response;
    try {
      switch (tx.transactionType.toLowerCase()) {
        case 'consumption':
          response = await VoucherService.getConsumptionVoucherDetails(id);
          break;
        case 'inward':
          response = await VoucherService.getInwardVoucher(id);
          break;
        case 'issue to site':
          response = await VoucherService.getIssueToSite(id);
          break;
        case 'issue to engineer':
          response = await VoucherService.getIssueToEngineer(id);
          break;
        default:
          console.warn(`Unhandled transactionType: "${tx.transactionType}"`);
          toast.error(`Unsupported transaction type: ${tx.transactionType}`);
          return;
      }
      setSelectedVoucher(response.data);
      setModalOpen(true);
    } catch (err) {
      console.error('❌ Failed to load voucher details:', err);
      toast.error('Failed to load voucher details');
    }
  };

  const handleDownload = async tx => {
    const id = extractId(tx.voucherNo);
    const transactionType = tx.transactionType.toLowerCase();
    try {
      let response;
      switch (transactionType) {
        case 'consumption':
          response = await VoucherService.getConsumptionVoucherDetails(id);
          break;
        case 'inward':
          response = await VoucherService.getInwardVoucher(id);
          break;
        case 'issue to site':
          response = await VoucherService.getIssueToSite(id);
          break;
        case 'issue to engineer':
          response = await VoucherService.getIssueToEngineer(id);
          break;
        default:
          console.warn(`Unhandled transactionType: "${transactionType}"`);
          toast.error(`Unsupported transaction type: ${transactionType}`);
          return;
      }
      setDownloadingVoucher(response.data);
      toast.success('Voucher download initiated');
    } catch (err) {
      console.error('❌ Failed to load voucher details:', err);
      toast.error('Failed to download voucher');
    }
  };

  // Fetch transactions data on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      if (effectRan.current) return;
      effectRan.current = true;
      setIsLoading(true);
      try {
        const userId = AuthService.getUserId();
        const response = await TransactionService.getAllTransactions(userId);
        const data = response.data?.data;
        if (!Array.isArray(data)) throw new Error('Invalid data format');
        setTransactions(data);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();

    // Fetch user roles on component mount
    const roles = AuthService.getUserRoles();
    setUserRoles(roles);
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

  // Get unique transaction types and site names for dropdown options
  const uniqueTransactionTypes = Array.from(new Set(transactions.map(tx => tx.transactionType).filter(Boolean)));
  const uniqueSites = Array.from(new Set(transactions.map(tx => tx.siteName).filter(Boolean)));

  // Filter transactions based on search query, transaction type, and site
  const filteredTransactions = transactions.filter(transaction => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = Object.values(transaction).some(value =>
      value && value.toString().toLowerCase().includes(query)
    );

    const matchesType = selectedTransactionType === 'all' || transaction.transactionType === selectedTransactionType;
    const matchesSite = selectedSite === 'all' || transaction.siteName === selectedSite;

    return matchesSearch && matchesType && matchesSite;
  });

  // Sort filtered transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Handle date sorting
    if (sortConfig.key === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Table headers
  const tableHeaders = ['VoucherNo', 'Type', 'SiteName', 'Date', 'actions'];

  // Helper function to get transaction type badge color
  const getTransactionTypeBadgeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'inward':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'consumption':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'issue to site':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'issue to engineer':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Helper function to format transaction type
  const formatTransactionType = (type) => {
    return type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <VoucherModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedVoucher}
      />
      {downloadingVoucher && (
        <VoucherModal
          isOpen={false}
          onClose={() => setDownloadingVoucher(null)}
          data={downloadingVoucher}
          autoDownload={true}
        />
      )}
      
      <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
        {/* Header and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3 py-3">
          {/* Title and Toggle Button in same row for mobile */}
          <div className="w-full flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              Transaction History
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

          {/* Action Buttons */}
          <div className="flex gap-2 w-full sm:w-auto sm:overflow-x-visible overflow-x-auto">
  {userRoles.includes('admin') && (
    <>
      <button
        className="flex items-center px-3 py-2 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => navigate('/materialtransfer')}
        disabled={isLoading}
        type="button"
      >
        <Plus className="w-4 h-4 mr-1" />
        Inward
      </button>
      <button
        className="flex items-center px-3 py-2 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => navigate('/IssueMaterialToSiteForm')}
        disabled={isLoading}
        type="button"
      >
        <Minus className="w-4 h-4 mr-1" />
        Issue
      </button>
    </>
  )}
  {userRoles.includes('sitemanager') && (
    <button
      className="flex items-center px-3 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={() => navigate('/issueMaterialForm')}
      disabled={isLoading}
      type="button"
    >
      Issue Material
    </button>
  )}
</div>
        </div>

        {/* Controls for search and filter dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 mb-4">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search Transactions..."
            className="flex-grow p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
          
          {/* Transaction Type Filter */}
          <select
            className="p-2 sm:p-1.5 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm transition-colors"
            value={selectedTransactionType}
            onChange={(e) => setSelectedTransactionType(e.target.value)}
            disabled={isLoading}
          >
            <option value="all">All Types</option>
            {uniqueTransactionTypes.map((type, index) => (
              <option key={index} value={type}>
                {formatTransactionType(type)}
              </option>
            ))}
          </select>

          {/* Site Filter */}
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

          {/* Reset Button */}
          <button 
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 sm:py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setSelectedTransactionType('all');
              setSelectedSite('all');
              setSearchQuery('');
            }}
            disabled={isLoading}
          >
            Reset
          </button>
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
                        <span className="text-xs">{header === 'actions' ? 'Actions' : header}</span>
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
                  currentItems.map((transaction, idx) => (
                    <tr 
                      key={`${transaction.voucherNo}-${idx}`} 
                      className={`hover:bg-gray-50 dark:hover:bg-darkPrimary/10 cursor-pointer ${
                        selectedTransaction && selectedTransaction.voucherNo === transaction.voucherNo 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-3 border-blue-500 dark:border-blue-400' 
                          : ''
                      }`}
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {transaction.voucherNo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getTransactionTypeBadgeColor(transaction.transactionType)}`}>
                          {formatTransactionType(transaction.transactionType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {transaction.siteName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(transaction);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            aria-label="View"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(transaction);
                            }}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            aria-label="Download"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      No transactions found
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
              currentItems.map((transaction, idx) => (
                <div 
                  key={`${transaction.voucherNo}-${idx}`} 
                  className={`rounded-lg border p-4 ${
                    selectedTransaction && selectedTransaction.voucherNo === transaction.voucherNo
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-darkPrimary/20 bg-white dark:bg-darkSurface'
                  }`}
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{transaction.voucherNo}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getTransactionTypeBadgeColor(transaction.transactionType)}`}>
                      {formatTransactionType(transaction.transactionType)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p className="mb-1"><span className="font-medium">Site:</span> {transaction.siteName}</p>
                    <p className="mb-1"><span className="font-medium">Date:</span> {new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkPrimary/10 flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(transaction);
                      }}
                      className="rounded-md bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(transaction);
                      }}
                      className="rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 bg-white dark:bg-darkSurface rounded-lg border border-gray-200 dark:border-darkPrimary/20">
                <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 px-1">
          <div className="text-xs text-gray-600 dark:text-gray-400 order-2 sm:order-1">
            {sortedTransactions.length > 0 ? 
              `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, sortedTransactions.length)} of ${sortedTransactions.length} entries` : 
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
    </>
  );
};

export default TransactionHistoryDashboard;