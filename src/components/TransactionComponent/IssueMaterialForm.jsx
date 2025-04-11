import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
// Service imports (update paths as needed)
import TransactionService from '../../services/TransactionService';
import AuthService from '../../services/AuthService';
import UserService from '../../services/UserService';
import RequestService from '../../services/RequestService'; // assumed service for requests
import MaterialService from '../../services/MaterialService';
import UnitService from '../../services/UnitService';


const IssueMaterialForm = () => {
  // Get site id and user id from AuthService
  const siteId = AuthService.getSiteId();
  const createdby = AuthService.getUserId();

  // Form state for the top-level fields
  const [formData, setFormData] = useState({
    request_id: '',
    remark: '',
    to_user_id: ''
  });

  // Arrays for dropdowns/populated data
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [units, setUnits] = useState([]);

  // Items state: array of objects { material_id, unit_type_id, quantity }
  const [items, setItems] = useState([
    { id: Date.now(), material_id: '', unit_type_id: '', quantity: 1 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch dropdown data when component mounts
  useEffect(() => {


    const fetchData = async () => {
      try {
        const [reqRes, usersRes, materialsRes, unitsRes] = await Promise.all([
          RequestService.getRequests("27"),
          UserService.getAllUsers(),
          MaterialService.getAllMaterials(),
          UnitService.getAllUnits()
        ]);
        setRequests(reqRes.data.data);
        setUsers(usersRes.data.data);
        setMaterials(materialsRes.data.data);
        setUnits(unitsRes.data.data);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };
    fetchData();
  }, []);

  // Add new item row
  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), material_id: '', unit_type_id: '', quantity: 1 }
    ]);
  };

  // Remove an item row (if more than one is present)
  const removeItemRow = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Handle change in any item row field
  const handleItemChange = (id, field, value) => {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      site_id: siteId,
      request_id: parseInt(formData.request_id, 10),
      remark: formData.remark,
      from_site_id: siteId,  // same as site_id
      to_user_id: parseInt(formData.to_user_id, 10),
      createdby: createdby,
      items: items.map(item => ({
        material_id: parseInt(item.material_id, 10),
        unit_type_id: parseInt(item.unit_type_id, 10),
        quantity: parseFloat(item.quantity)
      }))
    };

    try {
      // Call the transaction service to issue the material
      const response = await TransactionService.issueMaterialTransaction(payload);
      console.log('Transaction successful:', response.data);
      alert('Material issued successfully!');
      // Optionally reset form and/or redirect
      setFormData({
        request_id: '',
        remark: '',
        to_user_id: ''
      });
      setItems([{ id: Date.now(), material_id: '', unit_type_id: '', quantity: 1 }]);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error issuing material:', error);
      alert('Error issuing material');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-bold mb-4">Issue Material Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top-Level Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Request Dropdown */}
          <div>
            <label className="block mb-1">Request *</label>
            <select
              className="w-full border p-2 rounded"
              value={formData.request_id}
              onChange={(e) => setFormData({ ...formData, request_id: e.target.value })}
              required
            >
              <option value="">Select Request</option>
              {requests.map(r => (
                <option key={r.id} value={r.id}>
                  {r.request_name || `Request ${r.id}`}
                </option>
              ))}
            </select>
          </div>
          {/* To User Dropdown */}
          <div>
            <label className="block mb-1">Issue To User *</label>
            <select
              className="w-full border p-2 rounded"
              value={formData.to_user_id}
              onChange={(e) => setFormData({ ...formData, to_user_id: e.target.value })}
              required
            >
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username || u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Remark Field */}
        <div>
          <label className="block mb-1">Remark</label>
          <textarea
            className="w-full border p-2 rounded"
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            rows="3"
          ></textarea>
        </div>

        {/* Items Section */}
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">Items</h2>
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 items-end">
              {/* Material Dropdown */}
              <div>
                <label className="block mb-1">Material *</label>
                <select
                  className="w-full border p-2 rounded"
                  value={item.material_id}
                  onChange={(e) => handleItemChange(item.id, 'material_id', e.target.value)}
                  required
                >
                  <option value="">Select Material</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.material_name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Unit Dropdown */}
              <div>
                <label className="block mb-1">Unit *</label>
                <select
                  className="w-full border p-2 rounded"
                  value={item.unit_type_id}
                  onChange={(e) => handleItemChange(item.id, 'unit_type_id', e.target.value)}
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.unitsymbol}
                    </option>
                  ))}
                </select>
              </div>
              {/* Quantity Input */}
              <div>
                <label className="block mb-1">Quantity *</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                  min="1"
                  required
                />
              </div>
              {/* Remove Item Button */}
              <div className="md:col-span-3 text-right">
                <button
                  type="button"
                  onClick={() => removeItemRow(item.id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={items.length <= 1}
                >
                  Remove Item
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItemRow}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Item
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {isSubmitting ? 'Processing...' : 'Issue Material'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueMaterialForm;
