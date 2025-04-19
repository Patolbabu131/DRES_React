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
  const [showReview, setShowReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [materialsRes, unitsRes] = await Promise.all([
          MaterialService.getAllMaterials(),
          UnitService.getAllUnits()
        ]);
        setMaterials(materialsRes.data.data);
        setUnits(unitsRes.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
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

  // Helper functions to get material and unit names
  const getMaterialName = (id) => {
    const material = materials.find(m => m.id === Number(id));
    return material ? material.material_name : 'Unknown Material';
  };

  const getUnitSymbol = (id) => {
    const unit = units.find(u => u.id === Number(id));
    return unit ? unit.unitsymbol : 'Unknown Unit';
  };

  // Prepare for review
  const handleReview = (e) => {
    e.preventDefault();

    // Check if any required fields are missing
    const hasEmptyFields = items.some(item => !item.material_id || !item.unit_id);
    
    if (hasEmptyFields) {
      alert('Please fill all required fields before reviewing.');
      return;
    }
    
    // Ensure every item has a quantity greater than 0.
    if (items.some(item => item.quantity <= 0)) {
      alert('Quantity must be greater than 0 for all items.');
      return;
    } 
    
    // Validate that there are no duplicate material-unit combinations.
    if (hasDuplicateMaterialUnit()) {
      alert('Each item must have a unique combination of material and unit.');
      return;
    }

    setShowReview(true);
  };

  // Form submission
  const handleSubmit = async () => {
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-xl md:text-2xl font-bold mb-4 border-b pb-3 text-blue-800">
        Create Material Consumption
        <span className="block text-xs md:text-sm font-normal text-gray-500 mt-1">
          Record material usage and update inventory
        </span>
      </h1>

      {showReview ? (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Review Consumption Record</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-white p-3 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Date:</p>
                <p className="text-gray-800">{formData.date}</p>
              </div>
              
              {formData.remark && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Remarks:</p>
                  <p className="text-gray-800">{formData.remark}</p>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Consumption Items:</p>
              <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{getMaterialName(item.material_id)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{getUnitSymbol(item.unit_id)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.currentStock}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium text-red-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.currentStock - item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowReview(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Edit
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? 'Processing...' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReview} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remark
            </label>
            <textarea
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows="3"
              placeholder="Additional notes or details about this consumption"
            />
          </div>
          
          <div className="border-t pt-4">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Consumption Items
                <span className="block md:inline text-xs md:text-sm font-normal text-gray-500 md:ml-2">
                  Add materials being consumed
                </span>
              </h2>
              <span className="text-xs text-gray-500 mt-1 md:mt-0">
                {items.length} of 10 items added
              </span>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Item #{index + 1}</h4>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(item.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Material */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Material <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
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
                    
                    {/* Unit */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
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
                    
                    {/* Current Stock */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Current Stock
                      </label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 p-2 rounded-lg bg-gray-100 text-sm"
                        value={item.currentStock}
                        readOnly
                      />
                    </div>
                    
                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.currentStock}
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        required
                      />
                      {item.currentStock > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Max: {item.currentStock}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {items.length < 10 && (
              <button
                type="button"
                onClick={addItemRow}
                className="mt-4 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Item
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/consumption')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
            >
              Review Consumption
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateConsumptionForm;