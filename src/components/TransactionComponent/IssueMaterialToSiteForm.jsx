import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TransactionService from '../../services/TransactionService';
import AuthService from '../../services/AuthService';
import UserService from '../../services/UserService';
import RequestService from '../../services/RequestService';
import MaterialService from '../../services/MaterialService';
import UnitService from '../../services/UnitService';

const IssueMaterialToSiteForm = () => {
  const siteId = AuthService.getSiteId();
  const createdby = AuthService.getUserId();
  const userId = AuthService.getUserId();
  const navigate = useNavigate();
  const { requestId } = useParams();

  // State variables
  const [sites, setSites] = useState([]);
  const [allSites, setAllSites] = useState([]);
  const [formData, setFormData] = useState({
    request_id: '',
    remark: '',
    to_site_id: ''
  });

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, usersRes, materialsRes, unitsRes] = await Promise.all([
          RequestService.dropdownRequestList(userId),
          UserService.getUserList(userId),
          MaterialService.getAllMaterials(),
          UnitService.getAllUnits()
        ]);

        const fetchedRequests = reqRes.data.data;
        const fetchedUsers = usersRes.data.data;

        setAllRequests(fetchedRequests);
        setAllUsers(fetchedUsers);

        // Build unique sites list
        const siteMap = new Map();
        fetchedUsers.forEach(u => {
          if (!siteMap.has(u.site_id)) {
            siteMap.set(u.site_id, {
              site_id: u.site_id,
              siteName: u.site_name || u.siteName
            });
          }
        });

        const uniqueSites = Array.from(siteMap.values());
        setAllSites(uniqueSites);
        setSites(uniqueSites);

        setMaterials(materialsRes.data.data);
        setUnits(unitsRes.data.data);

        if (requestId) {
          const selectedReq = fetchedRequests.find(r => String(r.id) === String(requestId));
          if (selectedReq) {
            setFormData(f => ({
              ...f,
              request_id: String(selectedReq.id),
              to_site_id: String(selectedReq.site_id)
            }));
            setIsRequestPreselected(true);

            setRequests(fetchedRequests.filter(r => String(r.site_id) === String(selectedReq.site_id)));
            setUsers(fetchedUsers.filter(u => String(u.site_id) === String(selectedReq.site_id)));
          }
        } else {
          setRequests(fetchedRequests);
          setUsers(fetchedUsers);
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      }
    };

    fetchData();
  }, [userId, requestId]);

  const handleSiteSelect = (e) => {
    const siteId = e.target.value;
    setFormData(f => ({ ...f, to_site_id: siteId, request_id: '' }));

    if (siteId) {
      setRequests(allRequests.filter(r => String(r.site_id) === siteId));
      setUsers(allUsers.filter(u => String(u.site_id) === siteId));
    } else {
      setRequests(allRequests);
      setUsers(allUsers);
    }
  };

  const handleRequestSelect = (e) => {
    const reqId = e.target.value;
    if (!reqId) {
      setFormData(f => ({ ...f, request_id: '', to_site_id: '' }));
      setSites(allSites);
      setRequests(allRequests);
      return;
    }

    const req = allRequests.find(r => String(r.id) === reqId);
    if (!req) return;

    setFormData(f => ({
      ...f,
      request_id: reqId,
      to_site_id: String(req.site_id)
    }));

    setSites([allSites.find(s => String(s.site_id) === String(req.site_id))]);
    setRequests([req]);
    setUsers(allUsers.filter(u => String(u.site_id) === String(req.site_id)));
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), material_id: '', unit_type_id: '', quantity: 0, currentStock: 0 }
    ]);
  };

  const removeItemRow = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const hasDuplicateMaterialUnit = () => {
    const seen = new Set();
    for (const item of items) {
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

  const handleItemChange = (id, field, value) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item };

          if (field === 'material_id' || field === 'unit_type_id') {
            updatedItem[field] = value;
            updatedItem.quantity = 0;
            updatedItem.currentStock = 0;

            const selectedMaterial = field === 'material_id' ? value : updatedItem.material_id;
            const selectedUnit = field === 'unit_type_id' ? value : updatedItem.unit_type_id;

            if (selectedMaterial && selectedUnit) {
              TransactionService.getSiteStock(siteId, selectedMaterial, selectedUnit)
                .then(response => {
                  const stock = response.data;
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
      setRequestDetails(res.data.data);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching request details:', err);
      alert('Failed to load request details.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.to_site_id) {
      alert('Please select a destination site');
      setIsSubmitting(false);
      return;
    }

    if (items.some(item => item.quantity <= 0)) {
      alert('Quantity must be greater than 0 for all items.');
      setIsSubmitting(false);
      return;
    }

    if (hasDuplicateMaterialUnit()) {
      alert('Each item must have a unique combination of material and unit.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      request_id: parseInt(formData.request_id, 10),
      remark: formData.remark,
      from_site_id: siteId,
      to_site_id: parseInt(formData.to_site_id, 10),
      createdby: createdby,
      items: items.map(item => ({
        material_id: parseInt(item.material_id, 10),
        unit_type_id: parseInt(item.unit_type_id, 10),
        quantity: parseFloat(item.quantity)
      }))
    };

    try {
      const response = await TransactionService.createInterSiteTransaction(payload);
      console.log('Transaction successful:', response.data);
      alert('Material issued successfully!');
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
      <h1 className="text-2xl font-bold mb-4">Issue Material To Site</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Issue To Site *</label>
            <select
              className="w-full border p-2 rounded"
              value={formData.to_site_id}
              onChange={handleSiteSelect}
              required
              disabled={isRequestPreselected || isSubmitting}
            >
              <option value="">Select Destination Site</option>
              {sites.map(site => (
                <option key={site.site_id} value={site.site_id}>
                  {site.siteName} (Site ID: {site.site_id})
                </option>
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
                <option key={r.id} value={r.id}>{`Request No. ${r.id}`}</option>
              ))}
            </select>
          </div>
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
            <div className="flex items-end">
              <button
                type="button"
                onClick={fetchRequestDetails}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={isSubmitting} 
              >View Request Details</button>
            </div>
          )}
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
              <div>
                <label className="block mb-1">Current Stock</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded bg-gray-100"
                  value={item.currentStock}
                  readOnly
                />
              </div>
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

export default IssueMaterialToSiteForm;