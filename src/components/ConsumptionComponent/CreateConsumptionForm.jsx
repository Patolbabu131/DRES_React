import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import UserService from '../../services/UserService';
import MaterialService from '../../services/MaterialService';
import UnitService from '../../services/UnitService';
import ConsumptionService from '../../services/ConsumptionService';

const CreateConsumptionForm = () => {
  const navigate = useNavigate();
  const siteId = AuthService.getSiteId();
  const [formData, setFormData] = useState({
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    remark: '',
  });
  const [items, setItems] = useState([{ id: Date.now(), material_id: '', unit_id: '', quantity: 1 }]);
  const [users, setUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [units, setUnits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, materialsRes, unitsRes] = await Promise.all([
          UserService.getAllUsers(),
          MaterialService.getAllMaterials(),
          UnitService.getAllUnits()
        ]);
        setUsers(usersRes.data.data);
        setMaterials(materialsRes.data.data);
        setUnits(unitsRes.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const addItemRow = () => {
    setItems(prev => [...prev, 
      { id: Date.now(), material_id: '', unit_id: '', quantity: 1 }
    ]);
  };

  const removeItemRow = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      site_id: siteId,
      user_id: parseInt(formData.user_id, 10),
      date: formData.date,
      remark: formData.remark,
      items: items.map(item => ({
        material_id: parseInt(item.material_id, 10),
        unit_id: parseInt(item.unit_id, 10),
        quantity: parseInt(item.quantity, 10),
      })),
    };

    try {
      await ConsumptionService.addConsumption(payload);
      alert('Consumption created successfully!');
      navigate('/consumption');
    } catch (error) {
      console.error('Error creating consumption:', error);
      alert('Error creating consumption');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-bold mb-4">Create Material Consumption</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">User *</label>
            <select
              className="w-full border p-2 rounded"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              required
            >
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Date *</label>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">Remark</label>
          <textarea
            className="w-full border p-2 rounded"
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            rows="3"
          />
        </div>

        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">Items</h2>
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 items-end">
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
                    <option key={m.id} value={m.id}>{m.material_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Unit *</label>
                <select
                  className="w-full border p-2 rounded"
                  value={item.unit_id}
                  onChange={(e) => handleItemChange(item.id, 'unit_id', e.target.value)}
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.unitsymbol}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border p-2 rounded"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                  required
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => removeItemRow(item.id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={items.length <= 1}
                >
                  Remove
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Submitting...' : 'Create Consumption'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateConsumptionForm;