// ListConsumption.jsx
import React, { useState, useEffect } from 'react';
import ConsumptionService from '../../services/ConsumptionService'; // Adjust the path as needed
import AuthService from '../../services/AuthService'; // Adjust the path as needed
import { useNavigate } from 'react-router-dom';
import RoleBasedContent from '../context/RoleBasedContent';

const ListConsumption = () => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // Fetch consumption data once when the component mounts.
  useEffect(() => {
    // Change the user id as needed. In this case, 5.
    const userId = AuthService.getUserId();
    ConsumptionService.getConsumption(userId)
      .then((response) => {
        // Assuming the response returns an object with a 'data' property.
        setConsumptionData(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch consumption data.');
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Material Consumption Records</h1>
        <RoleBasedContent allowedRoles={['siteengineer']}>
        <button
            type="button"
            onClick={() => navigate('/consumptionform')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Consumption
        </button>
        </RoleBasedContent>
        </div>
      {consumptionData && consumptionData.length > 0 ? (
        consumptionData.map((record) => (
          <div key={record.id} className="mb-6 bg-white shadow rounded p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Record #{record.id}</h2>
              <p className="text-gray-600">
                Date: <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
              </p>
              <p className="text-gray-600">
                Site: <span className="font-medium">{record.site_name}</span>
              </p>
              <p className="text-gray-600">
                Remark: <span className="font-medium">{record.remark}</span>
              </p>
              <p className="text-gray-600">
                Created On: <span className="font-medium">{new Date(record.createdon).toLocaleDateString()}</span>
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Items</h3>
              {record.items && record.items.length > 0 ? (
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border">ID</th>
                      <th className="px-4 py-2 border">Material Name</th>
                      <th className="px-4 py-2 border">Unit Name</th>
                      <th className="px-4 py-2 border">Unit Symbol</th>
                      <th className="px-4 py-2 border">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.items.map((item) => (
                      <tr key={item.id} className="text-center">
                        <td className="px-4 py-2 border">{item.id}</td>
                        <td className="px-4 py-2 border">{item.material_name}</td>
                        <td className="px-4 py-2 border">{item.unit_name}</td>
                        <td className="px-4 py-2 border">{item.unit_symbol}</td>
                        <td className="px-4 py-2 border">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600">No items available.</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No consumption records found.</p>
      )}
    </div>
  );
};

export default ListConsumption;
