import React, { useEffect, useState } from 'react';
import stockService from '../../services/StockService';

const ListStock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await stockService.getAllStocks();
        if (response.data?.data) {
          setStocks(response.data.data);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchStocks();
  }, []);

  // Group stocks by site_name and then by material_name
  const groupedStocks = stocks.reduce((acc, stock) => {
    const siteKey = stock.site_name;
    const materialKey = stock.material_name;
    
    if (!acc[siteKey]) acc[siteKey] = {};
    if (!acc[siteKey][materialKey]) acc[siteKey][materialKey] = [];
    
    acc[siteKey][materialKey].push(stock);
    return acc;
  }, {});

  // Filter the grouped stocks based on search term
  const filteredGroupedStocks = Object.entries(groupedStocks).reduce((acc, [siteName, materials]) => {
    // Check if site name matches search term
    if (searchTerm && !siteName.toLowerCase().includes(searchTerm.toLowerCase())) {
      // Filter materials that match search term
      const filteredMaterials = Object.entries(materials).filter(([materialName, _]) => 
        materialName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredMaterials.length > 0) {
        acc[siteName] = Object.fromEntries(filteredMaterials);
      }
    } else {
      // Include site if it matches or no search term
      if (searchTerm) {
        // Still filter materials if there's a search term
        const filteredMaterials = Object.entries(materials).filter(([materialName, _]) => 
          materialName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (filteredMaterials.length > 0) {
          acc[siteName] = Object.fromEntries(filteredMaterials);
        }
      } else {
        // No search term, include all
        acc[siteName] = materials;
      }
    }
    return acc;
  }, {});
  
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow border border-red-200 m-4">
      <div className="font-medium">Error:</div>
      <div>{error}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Stock Inventory</h1>
        <div className="w-full sm:w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="Search stocks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute top-3 left-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(filteredGroupedStocks).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          No stock data available for your search
        </div>
      ) : (
        Object.entries(filteredGroupedStocks).map(([siteName, materials], siteIndex) => (
          <div key={siteName} className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-t-lg shadow-md">
              <h2 className="text-xl font-bold">{siteName}</h2>
            </div>
            
            <div className="overflow-x-auto bg-white rounded-b-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(materials).map(([materialName, materialStocks]) => (
                    materialStocks.map((stock, stockIndex) => (
                      <tr key={`${siteName}-${materialName}-${stockIndex}`} 
                          className="hover:bg-gray-50 transition-colors duration-150">
                        
                        {/* Material Name - only render for first row of the material group */}
                        {stockIndex === 0 && (
                          <td 
                            rowSpan={materialStocks.length}
                            className="py-3 px-4 font-medium text-gray-900"
                          >
                            {materialName}
                          </td>
                        )}
                        
                        <td className="py-3 px-4 text-gray-700">{stock.unit_symbol}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium 
                            ${parseFloat(stock.quantity) > 100 ? 'bg-green-100 text-green-800' : 
                              parseFloat(stock.quantity) > 20 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`
                          }>
                            {stock.quantity}
                          </span>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ListStock;