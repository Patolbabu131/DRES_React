import React, { useState, useEffect } from 'react';

const MaterialTransactionForm = () => {
  // State for form fields
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: 'purchase',
    supplier: '',
    fromToSite: '',
    date: new Date().toISOString().split('T')[0],
    remark: '',
    invoiceNo: `INV-${Math.floor(100000 + Math.random() * 900000)}`
  });

  // State for dynamic table rows
  const [rows, setRows] = useState([{
    id: Date.now(),
    material: '',
    unitType: 'kg',
    rate: 0,
    quantity: 1,
    taxableValue: 0,
    gst: 18,
    totalValue: 0
  }]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSuppliers(['Supplier A', 'Supplier B', 'Supplier C']);
        setMaterials(['Cement', 'Steel', 'Bricks', 'Sand', 'Paint']);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Add new row
  const addRow = () => {
    setRows([...rows, {
      id: Date.now(),
      material: '',
      unitType: 'kg',
      rate: 0,
      quantity: 1,
      taxableValue: 0,
      gst: 18,
      totalValue: 0
    }]);
  };

  // Remove row
  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  // Handle row changes
  const handleRowChange = (id, field, value) => {
    const updatedRows = rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        
        if (['rate', 'quantity', 'gst'].includes(field)) {
          const taxableValue = updatedRow.rate * updatedRow.quantity;
          const gstAmount = taxableValue * (updatedRow.gst / 100);
          updatedRow.taxableValue = parseFloat(taxableValue.toFixed(2));
          updatedRow.totalValue = parseFloat((taxableValue + gstAmount).toFixed(2));
        }
        return updatedRow;
      }
      return row;
    });
    setRows(updatedRows);
  };

  // Calculate totals
  const calculateTotals = () => {
    return rows.reduce((acc, row) => {
      acc.taxableValue += row.taxableValue;
      acc.gstValue += row.totalValue - row.taxableValue;
      acc.grandTotal += row.totalValue;
      return acc;
    }, { taxableValue: 0, gstValue: 0, grandTotal: 0 });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        items: rows,
        totals: calculateTotals()
      };
      console.log('Submission Data:', payload);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Transaction submitted successfully!');
    } catch (error) {
      alert('Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { taxableValue, gstValue, grandTotal } = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Material Transaction Form</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Transaction Type*</label>
            <select 
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.transactionType}
              onChange={(e) => setFormData({...formData, transactionType: e.target.value})}
              required
              disabled={isSubmitting}
            >
              <option value="purchase">Purchase</option>
              <option value="transfer">Transfer</option>
              <option value="return">Return</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {formData.transactionType === 'purchase' ? 'Supplier*' : 
               formData.transactionType === 'return' ? 'From Site*' : 'To Site*'}
            </label>
            {formData.transactionType === 'purchase' ? (
              <select
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                required
                disabled={isSubmitting}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.fromToSite}
                onChange={(e) => setFormData({...formData, fromToSite: e.target.value})}
                required
                disabled={isSubmitting}
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Invoice No</label>
            <input
              type="text"
              className="block w-full p-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
              value={formData.invoiceNo}
              readOnly
            />
          </div>
        </div>

        {/* Date & Remarks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date*</label>
            <input
              type="date"
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.remark}
              onChange={(e) => setFormData({...formData, remark: e.target.value})}
              rows="2"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material*</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (₹)*</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty*</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %*</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={row.material}
                      onChange={(e) => handleRowChange(row.id, 'material', e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select Material</option>
                      {materials.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={row.unitType}
                      onChange={(e) => handleRowChange(row.id, 'unitType', e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="kg">KG</option>
                      <option value="ltr">LTR</option>
                      <option value="nos">NOS</option>
                      <option value="box">BOX</option>
                      <option value="bag">BAG</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={row.rate}
                      onChange={(e) => handleRowChange(row.id, 'rate', parseFloat(e.target.value || 0))}
                      min="0"
                      step="0.01"
                      required
                      disabled={isSubmitting}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      className="w-full p-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={row.quantity}
                      onChange={(e) => handleRowChange(row.id, 'quantity', parseFloat(e.target.value || 0))}
                      min="1"
                      required
                      disabled={isSubmitting}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono">₹{row.taxableValue.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-16 p-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={row.gst}
                        onChange={(e) => handleRowChange(row.id, 'gst', parseFloat(e.target.value || 0))}
                        min="0"
                        max="28"
                        required
                        disabled={isSubmitting}
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono">₹{row.totalValue.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      disabled={isSubmitting || rows.length <= 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-auto w-full md:w-1/2">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable Value:</span>
              <span className="font-mono font-medium">₹{taxableValue.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between">
              <span className="text-gray-600">GST Amount:</span>
              <span className="font-mono font-medium">₹{gstValue.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Grand Total:</span>
              <span className="font-mono font-bold text-blue-800">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <div className="flex flex-wrap gap-4 justify-between border-t pt-6">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Item
            </button>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Submit Transaction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialTransactionForm;