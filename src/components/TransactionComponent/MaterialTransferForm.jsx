import React, { useState, useEffect } from 'react';
import TransactionService from '../../services/TransactionService';
import AuthService from '../../services/AuthService';
import UserService from '../../services/UserService';
import SupplerService from '../../services/SupplerService';
import ApiClient from '../../services/ApiClient';
import { useNavigate } from 'react-router-dom';
import MaterialService from '../../services/MaterialService';
import UnitService from '../../services/UnitService';

const MaterialTransactionForm = () => {
  const [suppliers, setSuppliers] = useState([]);
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [units, setUnits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    toSite: '1', // default to HO Stock (ID 1)
    date: new Date().toISOString().split('T')[0],
    remark: '',
    invoiceNo: '' // user must enter
  });

  const [rows, setRows] = useState([
    {
      id: Date.now(),
      material: '',
      unitType: '',
      rate: 0,
      quantity: 1,
      taxableValue: 0,
      gst: 18,
      gstAmount: 0,
      totalValue: 0
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          suppliersRes,
          sitesRes,
          materialsRes,
          unitsRes
        ] = await Promise.all([
          SupplerService.getAllSupplier(),
          ApiClient.getSitesList(AuthService.getUserId()),
          MaterialService.getAllMaterials(),
          UnitService.getAllUnits()
        ]);

        setSuppliers(suppliersRes.data.data);
        setSites(sitesRes.data.data);
        setMaterials(materialsRes.data.data);
        setUnits(unitsRes.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const addRow = () => {
    if (rows.length >= 10) {
      alert('Maximum 10 items are allowed.');
      return;
    }
    setRows([
      ...rows,
      {
        id: Date.now(),
        material: '',
        unitType: '',
        rate: 0,
        quantity: 1,
        taxableValue: 0,
        gst: 18,
        gstAmount: 0,
        totalValue: 0
      }
    ]);
  };

  const removeRow = (id) => {
    if (rows.length <= 1) return;
    setRows(rows.filter(row => row.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    const updatedRows = rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };

        if (['rate', 'quantity', 'gst'].includes(field)) {
          const taxableValue = updatedRow.rate * updatedRow.quantity;
          const gstAmount = taxableValue * (updatedRow.gst / 100);
          updatedRow.taxableValue = parseFloat(taxableValue.toFixed(2));
          updatedRow.gstAmount = parseFloat(gstAmount.toFixed(2));
          updatedRow.totalValue = parseFloat((taxableValue + gstAmount).toFixed(2));
        }
        return updatedRow;
      }
      return row;
    });
    setRows(updatedRows);
  };

  const hasDuplicateMaterialUnit = () => {
    const seen = new Set();
    for (const row of rows) {
      if (row.material && row.unitType) {
        const key = `${row.material}_${row.unitType}`;
        if (seen.has(key)) {
          return true;
        }
        seen.add(key);
      }
    }
    return false;
  };

  const calculateTotals = () => {
    return rows.reduce(
      (acc, row) => {
        acc.taxableValue += row.taxableValue;
        acc.gstValue += row.totalValue - row.taxableValue;
        acc.grandTotal += row.totalValue;
        return acc;
      },
      { taxableValue: 0, gstValue: 0, grandTotal: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoiceNo) {
      alert('Invoice number is required.');
      return;
    }
    if (hasDuplicateMaterialUnit()) {
      alert('Each row must have a unique combination of material and unit.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      invoice_number: formData.invoiceNo,
      transaction_date: new Date(formData.date).toISOString(),
      request_id: null,
      remark: formData.remark,
      form_supplier_id: parseInt(formData.supplier, 10),
      to_site_id: parseInt(formData.toSite, 10),
      createdby: AuthService.getUserId(),
      items: rows.map(row => ({
        material_id: parseInt(row.material, 10),
        unit_type_id: parseInt(row.unitType, 10),
        quantity: row.quantity,
        unit_price: row.rate,
        gst: row.gst,
        total: row.totalValue
      }))
    };

    try {
      const response = await TransactionService.createSiteTransaction(payload);
      console.log('API Response:', response.data);
      alert('Transaction submitted successfully!');

      setFormData({
        supplier: '',
        toSite: '1',
        date: new Date().toISOString().split('T')[0],
        invoiceNo: '',
        remark: ''
      });
      setRows([
        {
          id: Date.now(),
          material: '',
          unitType: '',
          rate: 0,
          quantity: 1,
          taxableValue: 0,
          gst: 18,
          gstAmount: 0,
          totalValue: 0
        }
      ]);

      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert('Error submitting form');
      if (error.response) {
        console.error("Bad Request:", error.response.data);// show validation messages in UI
      } 
    } finally {
      setIsSubmitting(false);
    }
  };

  const { taxableValue, gstValue, grandTotal } = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto p-2 sm:p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Inward Transaction</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Supplier*</label>
            <select 
              className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.company_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">To *</label>
            <select
              className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              value={formData.toSite}
              disabled
            >
              <option value="1">HO Stock</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date*</label>
            <input
              type="date"
              className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Invoice No*</label>
            <input
              type="text"
              className="block w-full p-2.5 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
              value={formData.invoiceNo}
              onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              className="block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows="2"
              disabled={isSubmitting}
            />
          </div>
        </div>




        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Item Details</h2>
          {/* Only show Add Item button if there are less than 10 rows */}
          {rows.length < 10 && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Item
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material*</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (₹)*</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty*</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %*</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Amount (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      className="w-full p-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={row.material}
                      onChange={(e) => handleRowChange(row.id, 'material', e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select Material</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.material_name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      className="w-full p-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={row.unitType}
                      onChange={(e) => handleRowChange(row.id, 'unitType', e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}> {unit.unitname} ({unit.unitsymbol})</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      className={`w-full p-1.5 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white ${
                        (!row.rate || row.rate <= 0) && isSubmitting ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={row.rate}
                      onChange={(e) => handleRowChange(row.id, 'rate', parseFloat(e.target.value || 0))}
                      min="1"
                      step="1"
                      required
                      disabled={isSubmitting}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      className="w-full p-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={row.quantity}
                      onChange={(e) => handleRowChange(row.id, 'quantity', parseFloat(e.target.value || 0))}
                      min="1"
                      required
                      disabled={isSubmitting}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-700">₹{row.taxableValue.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-16 p-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-700">₹{row.gstAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono font-medium text-gray-700">₹{row.totalValue.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 focus:outline-none"
                      disabled={isSubmitting || rows.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row md:justify-end gap-4 border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-3/4 lg:w-2/3">
            <div className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Taxable Value:</span>
                <span className="font-mono font-medium">₹{taxableValue.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">GST Amount:</span>
                <span className="font-mono font-medium">₹{gstValue.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-md shadow-sm border border-blue-200">
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Grand Total:</span>
                <span className="font-mono font-bold text-blue-800">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-6">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
