import React, { useState, useEffect } from 'react';
import MaterialService from '../../services/MaterialService';
import UnitService from '../../services/UnitService';
import RequestService from '../../services/RequestService';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';

const AddMaterialRequest = () => {
  const [materials, setMaterials] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    remark: '',
    items: [{
      id: Date.now(),
      material_id: '',
      unit_id: '',
      quantity: ''
    }]
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, unitsRes] = await Promise.all([
          MaterialService.getAllMaterials(),
          UnitService.getAllUnits()
        ]);
        
        setMaterials(materialsRes.data.data);
        setUnits(unitsRes.data.data);
      } catch (err) {
        setError('Failed to load form data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Add a new item, maximum of 10 items allowed
  const addNewItem = () => {
    if (formData.items.length >= 10) {
      alert('Maximum 10 items are allowed.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          material_id: '',
          unit_id: '',
          quantity: ''
        }
      ]
    }));
  };

  // Remove an item, enforce minimum 1 item remains.
  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Helper function to validate duplicate material-unit combinations
  const hasDuplicateMaterialUnit = () => {
    const seen = new Set();
    for (const item of formData.items) {
      // Only consider valid selections
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

  // Find material and unit names by their IDs
  const getMaterialName = (id) => {
    const material = materials.find(m => m.id === Number(id));
    return material ? material.material_name : 'Unknown Material';
  };

  const getUnitInfo = (id) => {
    const unit = units.find(u => u.id === Number(id));
    return unit ? `${unit.unitname} (${unit.unitsymbol})` : 'Unknown Unit';
  };

  const toggleReview = () => {
    // Check for required fields before showing review
    const hasEmptyFields = formData.items.some(item => 
      !item.material_id || !item.unit_id || !item.quantity
    );
    
    if (hasEmptyFields) {
      alert('Please fill all required fields before reviewing.');
      return;
    }
    
    if (hasDuplicateMaterialUnit()) {
      alert('Each item must have a unique combination of material and unit.');
      return;
    }
    
    setShowReview(!showReview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for duplicate material-unit combinations:
    if (hasDuplicateMaterialUnit()) {
      alert('Each item must have a unique combination of material and unit.');
      return;
    }

    try {
      // Retrieve the user id from AuthService
      const userId = AuthService.getUserId();

      // Prepare the final payload in the required format
      const payload = {
        requested_by: Number(userId),
        remark: formData.remark,
        items: formData.items.map(item => ({
          material_id: Number(item.material_id),
          unit_id: Number(item.unit_id),
          quantity: Number(item.quantity)
        }))
      };

      console.log('Submitting:', payload);
      // Send the payload to the createRequest endpoint
      await RequestService.createRequest(payload);

      alert('Request submitted successfully!');
      // Reset form after submission
      setFormData({
        remark: '',
        items: [{
          id: Date.now(),
          material_id: '',
          unit_id: '',
          quantity: ''
        }]
      });
     
      navigate('/listrequest');
    } catch (err) {
      console.error('Submission error:', err);
      alert('Submission failed!');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-700 rounded-lg">
      {error} - Please try refreshing the page
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 border-b pb-3">
        New Material Request
        <span className="block text-xs md:text-sm font-normal text-gray-500 mt-1">
          Fill in the details below to create a new request
        </span>
      </h2>

      {showReview ? (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Review Your Request</h3>
            
            {formData.remark && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Remarks:</p>
                <p className="bg-white p-2 rounded border border-gray-200 text-gray-600">{formData.remark}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Requested Items:</p>
              <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{getMaterialName(item.material_id)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{getUnitInfo(item.unit_id)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
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
              onClick={toggleReview}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Edit
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
            >
              Confirm & Submit
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => {e.preventDefault(); toggleReview();}} className="space-y-6">
          
          {/* Remarks */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300"
              rows="3"
              placeholder="Additional notes or special instructions"
              required
            />
          </div>

          {/* Request Items */}
          <div className="border-t pt-6">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Request Items
                <span className="block md:inline text-xs md:text-sm font-normal text-gray-500 md:ml-2">
                  Add materials to your request
                </span>
              </h3>
              <span className="text-xs text-gray-500 mt-1 md:mt-0">
                {formData.items.length} of 10 items added
              </span>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Item #{index + 1}</h4>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Material */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Material <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.material_id}
                        onChange={(e) => handleItemChange(index, 'material_id', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300"
                        required
                      >
                        <option value="">Select Material</option>
                        {materials.map(material => (
                          <option key={material.id} value={material.id}>
                            {material.material_name}
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
                        value={item.unit_id}
                        onChange={(e) => handleItemChange(index, 'unit_id', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300"
                        required
                      >
                        <option value="">Select Unit</option>
                        {units.map(unit => (
                          <option key={unit.id} value={unit.id}>
                            {unit.unitname} ({unit.unitsymbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new item button is hidden if already 10 items */}
            {formData.items.length < 10 && (
              <button
                type="button"
                onClick={addNewItem}
                className="mt-4 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Item
              </button>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/listrequest')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
            >
              Review Request
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddMaterialRequest;