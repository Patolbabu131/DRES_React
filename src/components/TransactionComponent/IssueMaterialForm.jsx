import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TransactionService from '../../services/TransactionService';
import AuthService from '../../services/AuthService';
import UserService from '../../services/UserService';
import RequestService from '../../services/RequestService';
import MaterialService from '../../services/MaterialService';
import UnitService from '../../services/UnitService';

const IssueMaterialForm = () => {
  const siteId = AuthService.getSiteId();
  const createdby = AuthService.getUserId();
  const userId = AuthService.getUserId();
  const navigate = useNavigate();
  const { requestId } = useParams();  

  // form data
  const [formData, setFormData] = useState({
    request_id: '',
    remark: '',
    to_user_id: ''
  });

  // dropdown lists & originals
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [units, setUnits] = useState([]);

  const [items, setItems] = useState([
    { id: Date.now(), material_id: '', unit_type_id: '', quantity: 0, currentStock: 0 }
  ]);
  const [isRequestPreselected, setIsRequestPreselected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Fetch dropdown data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, usersRes, materialsRes, unitsRes] = await Promise.all([
          RequestService.dropdownRequestList(userId),
          UserService.getUserList(userId),
          MaterialService.getAllMaterials(),
          UnitService.getAllUnits()
        ]);

        // originals
        const fetchedRequests = reqRes.data.data;
        const fetchedUsers = usersRes.data.data;

        setAllRequests(fetchedRequests);
        setAllUsers(fetchedUsers);

        // defaults
        setMaterials(materialsRes.data.data);
        setUnits(unitsRes.data.data);

        // if URL has requestId, preselect and filter both lists
        if (requestId) {
          const selectedReq = fetchedRequests.find(r => String(r.id) === String(requestId));
          if (selectedReq) {
            setFormData(prev => ({
              ...prev,
              request_id: String(selectedReq.id),
              to_user_id: String(selectedReq.user_id)
            }));
            setIsRequestPreselected(true);

            // restrict requests dropdown to the single request
            setRequests([selectedReq]);
            // restrict users dropdown to the engineer who made the request
            const matchingUser = fetchedUsers.filter(u => String(u.id) === String(selectedReq.user_id));
            setUsers(matchingUser);
          }
        } else {
          // no URL preselection: use full lists
          setRequests(fetchedRequests);
          setUsers(fetchedUsers);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };
    fetchData();
  }, [userId, requestId]);


  const handleUserSelect = (e) => {
  const selectedUserId = e.target.value;
  setFormData(prev => ({ ...prev, to_user_id: selectedUserId, request_id: '' }));
  
  if (selectedUserId) {
    const filteredRequests = allRequests.filter(r => String(r.user_id) === selectedUserId);
    setRequests(filteredRequests);
  } else {
    setRequests(allRequests);
  }
};

  const handleRequestSelect = (e) => {
  const selectedRequestId = e.target.value;
  setFormData(prev => ({ ...prev, request_id: selectedRequestId }));

  if (selectedRequestId) {
    const req = allRequests.find(r => String(r.id) === selectedRequestId);
    if (req) {
      const matchingUser = allUsers.filter(u => String(u.id) === String(req.user_id));
      setUsers(matchingUser);
      setFormData(prev => ({ ...prev, to_user_id: String(req.user_id) }));
    }
  }
};
const handleResetSelection = () => {
  setFormData({ to_user_id: '', request_id: '', remark: '' });
  setUsers(allUsers);
  setRequests(allRequests);
};

  // Add new item row
  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), material_id: '', unit_type_id: '', quantity: 0, currentStock: 0 }
    ]);
  };

  // Remove an item row (if more than one is present)
  const removeItemRow = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Helper function to check for duplicate material-unit combinations.
  const hasDuplicateMaterialUnit = () => {
    const seen = new Set();
    for (const item of items) {
      // Only consider if both material and unit are selected.
      if (item.material_id && item.unit_type_id) {
        const key = `${item.material_id}_${item.unit_type_id}`;
        if (seen.has(key)) {
          return true;
        }
        seen.add(key);
      }
    }
    return false;
  };

  // Handle changes for each item field.
  // On material or unit change, reset quantity and currentStock and fetch new stock.
  // For quantity change, cap it to currentStock.
  const handleItemChange = (id, field, value) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item };

          if (field === 'material_id' || field === 'unit_type_id') {
            updatedItem[field] = value;
            // Reset the quantity and currentStock until fetch completes.
            updatedItem.quantity = 0;
            updatedItem.currentStock = 0;

            // If both material and unit are selected, fetch current stock.
            const selectedMaterial = field === 'material_id' ? value : updatedItem.material_id;
            const selectedUnit = field === 'unit_type_id' ? value : updatedItem.unit_type_id;

            if (selectedMaterial && selectedUnit) {
              TransactionService.getSiteStock(siteId, selectedMaterial, selectedUnit)
                .then(response => {
                  const stock = response.data; // Expected to be a number.
                  // Set initial quantity to 1 if there's stock, otherwise remains 0.
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
            // Cap quantity to currentStock even if currentStock is 0.
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
  const fetchRequestDetails = async () => {
    if (!formData.request_id) return;
    try {
      const res = await RequestService.getRequestDetails(formData.request_id);
      // res.data === { message: "...", data: { /* → the object you showed */ } }
      setRequestDetails(res.data.data);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching request details:', err);
      alert('Failed to load request details.');
    }
  };

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that each item has a quantity greater than 0.
    if (items.some(item => item.quantity <= 0)) {
      alert('Quantity must be greater than 0 for all items.');
      setIsSubmitting(false);
      return;
    }

    // Check for duplicate material and unit combination.
    if (hasDuplicateMaterialUnit()) {
      alert('Each item must have a unique combination of material and unit.');
      setIsSubmitting(false);
      return;
    }

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
      const response = await TransactionService.issueMaterialTransaction(payload);
      console.log('Transaction successful:', response.data);
      alert('Material issued successfully!');
      // Optionally reset form and/or redirect
      setFormData({ request_id: '', remark: '', to_user_id: '' });
      setItems([{ id: Date.now(), material_id: '', unit_type_id: '', quantity: 0, currentStock: 0 }]);
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
      <h1 className="text-2xl font-bold mb-4">Issue Material To Site Enigneer</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top-Level Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         
        <div>
            <label className="block mb-1">Issue To Engineer *</label>
            <select
              className="w-full border p-2 rounded"
              value={formData.to_user_id}
              onChange={handleUserSelect}
              required
              disabled={isRequestPreselected || isSubmitting}
            >
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username || u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Request *</label>
            <select
              className="w-full border p-2 rounded"
              value={formData.request_id}
              onChange={handleRequestSelect}
              disabled={isRequestPreselected || isSubmitting}
            >
              <option value="">Select Request</option>
              {requests.map(r => (
                <option key={r.id} value={r.id}>{r.request_name || `Request No. ${r.id}`}</option>
              ))}
            </select>
          </div>
          {/* Remark Field */}
        <div>
          <label className="block mb-1">Remark</label>
          <textarea
            className="w-full border p-2 rounded"
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            rows="1"
            disabled={isSubmitting} 
          ></textarea>
        </div>
          {formData.request_id && (
            <div className="flex items-end gap-x-3">
  <button
    type="button"
    onClick={handleResetSelection}
    className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
    disabled={isSubmitting}
  >
    Reset
  </button>
  <button
    type="button"
    onClick={fetchRequestDetails}
    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
    disabled={isSubmitting}
  >
    View Request Details
  </button>
</div>
          )}

     

        </div>
  

       

        {/* Items Section */}
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">Items</h2>
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 items-end">
              {/* Material Dropdown */}
              <div>
                <label className="block mb-1">Material *</label>
                <select
                  className="w-full border p-2 rounded"
                  value={item.material_id}
                  onChange={(e) => handleItemChange(item.id, 'material_id', e.target.value)}
                  required
                  disabled={isSubmitting} 
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
                  disabled={isSubmitting} 
                >
                  <option value="">Select Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.unitname} ({u.unitsymbol})
                    </option>
                  ))}
                </select>
              </div>
              {/* Quantity Input */}
              <div>
                <label className="block mb-1">Quantity *</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border p-2 rounded"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                  required
                  disabled={isSubmitting} 
                />
              </div>
              {/* Current Stock Display */}
              <div>
                <label className="block mb-1">Current Stock</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={item.currentStock}
                  readOnly
                />
              </div>
              {/* Remove Button */}
              <div className="md:col-span-4 text-right">
                <button
                  type="button"
                  onClick={() => removeItemRow(item.id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={items.length <= 1 || isSubmitting}                   
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
            disabled={isSubmitting} 
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
      {showModal && requestDetails && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white p-6 rounded-lg w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Request Details</h2>

      <div className="text-sm mb-4 space-y-2">
        <div><strong>Site:</strong> {requestDetails.site_name}</div>
        <div>
          <strong>Requested On:</strong>{' '}
          {new Date(requestDetails.request_date).toLocaleString()}
        </div>
        <div><strong>Requested By:</strong> {requestDetails.requested_by}</div>
        <div><strong>Status:</strong> {requestDetails.status}</div>
        <div><strong>Remark:</strong> {requestDetails.remark}</div>
        <div>
          <strong>Forwarded To HO:</strong>{' '}
          {requestDetails.forwarded_to_ho ? 'Yes' : 'No'}
        </div>

        <div className="mt-3">
          <strong>Items:</strong>
          <div className="overflow-x-auto mt-1">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Material</th>
                  <th className="border px-2 py-1">Unit</th>
                  <th className="border px-2 py-1">Qty</th>
                </tr>
              </thead>
              <tbody>
                {requestDetails.items.map(item => (
                  <tr key={item.id}>
                    <td className="border px-2 py-1">{item.material_name}</td>
                    <td className="border px-2 py-1">
                      {item.unit_name} ({item.unit_symbol})
                    </td>
                    <td className="border px-2 py-1">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowModal(false)}
        className="w-full sm:w-auto block sm:inline-block mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-center"
      >
        Close
      </button>
    </div>
  </div>
)}


    </div>
  );
};

export default IssueMaterialForm;
