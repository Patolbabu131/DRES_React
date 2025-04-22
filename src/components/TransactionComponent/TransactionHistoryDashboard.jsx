import React, { useState, useEffect } from 'react';
import TransactionService from '../../services/TransactionService';
import AuthService from '../../services/AuthService';

const TransactionHistoryDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const userId = AuthService.getUserId();
        const response = await TransactionService.getAllTransactions(userId);
        // API returns { message, data: [] }
        const data = response.data?.data;
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format');
        }
        setTransactions(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load transactions.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-4">
        <p className="text-gray-600">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Transaction History</h1>
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx, index) => (
              <tr key={`${tx.voucherNo}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{tx.voucherNo}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm capitalize text-gray-700">{tx.transactionType}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{tx.siteName}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(tx.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistoryDashboard;
