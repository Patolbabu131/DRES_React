import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';
import MaterialService from '../../services/MaterialService';
import UnitService from '../../services/UnitService';
import ConsumptionService from '../../services/ConsumptionService';

const CreateConsumptionForm = () => {
  const navigate = useNavigate();
  const siteId = AuthService.getSiteId();
  const userId = AuthService.getUserId();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    remark: '',
  });
  // Initialize quantity to 0 so that the user must enter a valid amount
  const [items, setItems] = useState([
    { id: Date.now(), material_id: '', unit_id: '', quantity: 0, currentStock: 0 }
  ]);
  const [materials, setMaterials] = useState([]);
  const [units, setUnits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, unitsRes] = await Promise.all([
          MaterialService.getAllMaterials(),
          UnitService.getAllUnits()
        ]);
        setMaterials(materialsRes.data.data);
        setUnits(unitsRes.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Add a new item row with a maximum of 10 items allowed
  const addItemRow = () => {
    if (items.length >= 10) {
      alert('Maximum 10 items are allowed.');
      return;
    }
    setItems(prev => [
      ...prev,
      { id: Date.now(), material_id: '', unit_id: '', quantity: 0, currentStock: 0 }
    ]);
  };

  // Remove an item row, ensuring at least one item remains
  const removeItemRow = (id) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Handle changes for each item field.
  // When material or unit is changed, reset quantity and currentStock,
  // then fetch current stock if both are selected.
  const handleItemChange = (id, field, value) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item };

          if (field === 'material_id' || field === 'unit_id') {
            updatedItem[field] = value;
            // Reset quantity and currentStock until updated
            updatedItem.quantity = 0;
            updatedItem.currentStock = 0;

            if ((field === 'material_id' ? value : updatedItem.material_id) &&
                (field === 'unit_id' ? value : updatedItem.unit_id)) {
              const materialId = field === 'material_id' ? value : updatedItem.material_id;
              const unitId = field === 'unit_id' ? value : updatedItem.unit_id;

              ConsumptionService.getStock(userId, materialId, unitId)
                .then(response => {
                  const stock = response.data;
                  // If there is any available stock, initialize to 1; else leave as 0.
                  const initialQuantity = stock > 0 ? 1 : 0;
                  setItems(prevItems =>
                    prevItems.map(i =>
                      i.id === id
                        ? { ...i, currentStock: stock, quantity: initialQuantity }
                        : i
                    )
                  );
                })
                .catch(err => {
                  console.error("Error fetching stock:", err);
                });
            }
          } else if (field === 'quantity') {
            const numericValue = parseInt(value, 10);
            // Always compare directly regardless of truthiness
            if (numericValue > updatedItem.currentStock) {
              updatedItem.quantity = updatedItem.currentStock;
            } else {
              updatedItem.quantity = numericValue;
            }
          } else {
            updatedItem[field] = value;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Helper function to check for duplicate material-unit combinations
  const hasDuplicateMaterialUnit = () => {
    const seen = new Set();
    for (const item of items) {
      if (item.material_id && item.unit_id) {
        const key = `${item.material_id}_${item.unit_id}`;
        if (seen.has(key)) {
          return true;
        }
        seen.add(key);
      }
    }
    return false;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure every item has a quantity greater than 0.
    if (items.some(item => item.quantity <= 0)) {
      alert('Quentity must be greater than 0 for all items.');
      setIsSubmitting(false);
      return;
    } 
    // Validate that there are no duplicate material-unit combinations.
    if (hasDuplicateMaterialUnit()) {
      alert('Each item must have a unique combination of material and unit.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      site_id: siteId,
      user_id: userId,
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
            <label className="block mb-1">Date *</label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
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
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2 items-end">
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
                    <option key={u.id} value={u.id}>
                      {u.unitsymbol}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Quantity *</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border p-2 rounded"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Current Stock</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={item.currentStock}
                  readOnly
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
          {items.length < 10 && (
            <button
              type="button"
              onClick={addItemRow}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Item
            </button>
          )}
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
