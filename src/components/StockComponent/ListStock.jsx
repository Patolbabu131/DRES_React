import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import StockService from '../../services/StockService';
import AuthService from '../../services/AuthService';
import RoleBasedContent from '../context/RoleBasedContent';

const ListStock = () => {
  const [sites, setSites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [collapsedSites, setCollapsedSites] = useState({});
  const effectRan = useRef(false);

  const { isLoading, setIsLoading } = useOutletContext();
  const { isDark } = useTheme();
  const userId = AuthService.getUserId();

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.style.backgroundColor = isDark ? '#000' : '';
  }, [isDark]);

  // Load collapsed state from cookies
  useEffect(() => {
    const saved = Cookies.get('collapsedSites');
    if (saved) {
      try { setCollapsedSites(JSON.parse(saved)); } catch {};
    }
  }, []);

  // Fetch data
  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    setIsLoading(true);
    if (!userId) {
      toast.error('User not logged in');
      setIsLoading(false);
      return;
    }
    StockService.getAllStocks(userId)
      .then(({ data: { message, data } }) => {
        if (message === 'Success') setSites(data);
        else toast.error(`API Error: ${message}`);
      })
      .catch(err => {
        console.error(err);
        toast.error(err.response?.data?.message || err.message || 'Unknown error');
      })
      .finally(() => setIsLoading(false));
  }, [userId, setIsLoading]);

  // Dropdown options
  const siteOptions = useMemo(() => sites.map(s => s.siteName), [sites]);
  const materialOptions = useMemo(() => {
    const mats = new Set();
    sites.forEach(site => site.stocks.forEach(row => mats.add(row.materialName)));
    return Array.from(mats);
  }, [sites]);

  // Filter logic
  const filteredSites = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sites
      .filter(site => !selectedSite || site.siteName === selectedSite)
      .map(site => {
        const stocks = site.stocks.filter(row => {
          const matchesSearch = !searchTerm ||
                     site.siteName.toLowerCase().includes(term) ||
                     row.materialName.toLowerCase().includes(term) ||
                    row.unitName.toLowerCase().includes(term) ||
                    row.siteStock.toString().includes(term) ||
                    Object.entries(row.engineerStocks).some(
                      ([name, qty]) => name.toLowerCase().includes(term) || qty.toString().includes(term)
                     );
          const matchesMaterial = !selectedMaterial || row.materialName === selectedMaterial;
          return matchesSearch && matchesMaterial;
        });
        return { ...site, stocks };
      })
      .filter(site => site.stocks.length > 0);
  }, [sites, searchTerm, selectedSite, selectedMaterial]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedSite('');
    setSelectedMaterial('');
  };

  const toggleSite = (siteName) => {
    const updated = { ...collapsedSites, [siteName]: !collapsedSites[siteName] };
    setCollapsedSites(updated);
    Cookies.set('collapsedSites', JSON.stringify(updated), { expires: 365 });
  };

  return (
    <div className="container mx-auto px-5 sm:px-4 max-w-7xl min-h-screen relative">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Stock Master</h1>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-grow sm:flex-none px-4 py-2 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            disabled={isLoading}
          />
          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm"
            disabled={isLoading}
          >
            <option value="">All Sites</option>
            {siteOptions.map((site, idx) => (
              <option key={idx} value={site}>{site}</option>
            ))}
          </select>
          <select
            value={selectedMaterial}
            onChange={e => setSelectedMaterial(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 border-gray-300 dark:border-darkPrimary/20 text-sm"
            disabled={isLoading}
          >
            <option value="">All Materials</option>
            {materialOptions.map((mat, idx) => (
              <option key={idx} value={mat}>{mat}</option>
            ))}
          </select>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
            disabled={isLoading}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-darkPrimary/20">
        {filteredSites.map(site => {
          const users = Array.from(new Set(
            site.stocks.flatMap(s => Object.keys(s.engineerStocks))
          ));
          const isCollapsed = !!collapsedSites[site.siteName];
          const isExpanded = !isCollapsed;
          return (
            <div key={site.siteName} className="mb-6">
              <div
                onClick={() => toggleSite(site.siteName)}
                className="flex justify-between items-center bg-gray-50 dark:bg-darkSurface/50 px-4 py-2 cursor-pointer"
              >
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {site.siteName}
                </h2>
                <div className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                  {isExpanded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
              {isExpanded && (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-darkPrimary/20">
                  <thead className="bg-gray-50 dark:bg-darkSurface/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Material</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>
                      <RoleBasedContent allowedRoles={['admin', 'sitemanager']}> 
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Site Stock</th>
                      </RoleBasedContent>
                      {users.map(user => (
                        <th key={user} className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{user}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-darkSurface divide-y divide-gray-200 dark:divide-darkPrimary/20">
                    {site.stocks.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-darkPrimary/10">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.materialName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.unitName}</td>
                        <RoleBasedContent allowedRoles={['admin', 'sitemanager']}> 
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">{row.siteStock}</td>
                        </RoleBasedContent>
                        {users.map(user => (
                          <td key={user} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">{row.engineerStocks[user] || 0}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListStock;
