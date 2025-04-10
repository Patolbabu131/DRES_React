import React, { useEffect, useState } from 'react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import RequestService from '../../services/RequestService';
import AuthService from '../../services/AuthService';
import { useNavigate } from 'react-router-dom';

const ListRequest = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    site: '',
    userRole: '',
    userName: '',
    fromDate: '',
    toDate: '',
  });

  // Populate dropdowns
  const [uniqueSites, setUniqueSites] = useState([]);
  const [uniqueUserNames, setUniqueUserNames] = useState([]);
  const [uniqueUserRoles, setUniqueUserRoles] = useState([]);

  const navigate = useNavigate();

  // Fetch current user role and requests
  // Fetch current user role and requests
useEffect(() => {
  const fetchData = async () => {
    try {
      const userId = AuthService.getUserId();
      const roles = AuthService.getUserRoles();
      // If roles is an array, use its first element
      const roleStr = Array.isArray(roles) && roles.length > 0 ? roles[0] : roles;
      setCurrentUserRole(typeof roleStr === 'string' ? roleStr.toLowerCase() : '');
      
      const response = await RequestService.getRequests(userId);
      
      if (response.data?.data) {
        const all = response.data.data;
        setRequests(all);
        setFilteredRequests(all);

        setUniqueSites([...new Set(all.map(r => r.site_name))]);
        setUniqueUserNames([...new Set(all.map(r => r.requested_by))]);
        setUniqueUserRoles([...new Set(all.map(r => (r.user_role || '').toLowerCase()))]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };
  fetchData();
}, []);

  // Filter logic
  useEffect(() => {
    const result = requests.filter(r => {
      const { search, site, userRole, userName, fromDate, toDate } = filters;
      const lowerSearch = search.toLowerCase();

      // Role-based search handling
      const matchesSearch = currentUserRole === 'admin' ? (
        r.site_name.toLowerCase().includes(lowerSearch) ||
        r.requested_by.toLowerCase().includes(lowerSearch) ||
        (r.items?.some(item => item.material_name.toLowerCase().includes(lowerSearch)))
      ) : true;

      // Role-based filter handling
      const matchesSite = currentUserRole === 'admin' ? (site ? r.site_name === site : true) : true;
      const matchesUserRole = (currentUserRole === 'admin' || currentUserRole === 'sitemanager') ? 
        (userRole ? (r.user_role || '').toLowerCase() === userRole.toLowerCase() : true) : true;
      const matchesUserName = (currentUserRole === 'admin' || currentUserRole === 'sitemanager') ? 
        (userName ? r.requested_by === userName : true) : true;

      // Date filtering for all roles
      const reqDate = parseISO(r.request_date);
      const matchesFromDate = fromDate ? (
        isAfter(reqDate, parseISO(fromDate)) || 
        format(reqDate, 'yyyy-MM-dd') === format(parseISO(fromDate), 'yyyy-MM-dd')
      ) : true;
      
      const matchesToDate = toDate ? (
        isBefore(reqDate, parseISO(toDate)) || 
        format(reqDate, 'yyyy-MM-dd') === format(parseISO(toDate), 'yyyy-MM-dd')
      ) : true;

      return (
        matchesSearch &&
        matchesSite &&
        matchesUserRole &&
        matchesUserName &&
        matchesFromDate &&
        matchesToDate
      );
    });

    setFilteredRequests(result);
  }, [filters, requests, currentUserRole]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      site: '',
      userRole: '',
      userName: '',
      fromDate: '',
      toDate: '',
    });
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleNewRequest = () => {
    navigate('/AddMaterialRequest');
  };

  return (
    <div className="space-y-6">
      {/* New Request Button */}
      {(currentUserRole === 'sitemanager' || currentUserRole === 'siteengineer') && (
        <div className="flex justify-end">
          <button
            onClick={handleNewRequest}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Request
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Admin-only filters */}
          {currentUserRole === 'admin' && (
            <>
              <input
                type="text"
                name="search"
                placeholder="Search..."
                className="border p-2 rounded"
                value={filters.search}
                onChange={handleChange}
              />
              <select
                name="site"
                className="border p-2 rounded"
                value={filters.site}
                onChange={handleChange}
              >
                <option value="">All Sites</option>
                {uniqueSites.map((site, idx) => (
                  <option key={idx} value={site}>{site}</option>
                ))}
              </select>
            </>
          )}

          {/* Admin and Site Manager filters */}
          {(currentUserRole === 'admin' || currentUserRole === 'sitemanager') && (
            <>
              <select
                name="userRole"
                className="border p-2 rounded"
                value={filters.userRole}
                onChange={handleChange}
              >
                <option value="">All Roles</option>
                {uniqueUserRoles.map((role, idx) => (
                  <option key={idx} value={role}>{role}</option>
                ))}
              </select>
              <select
                name="userName"
                className="border p-2 rounded"
                value={filters.userName}
                onChange={handleChange}
              >
                <option value="">All Users</option>
                {uniqueUserNames.map((user, idx) => (
                  <option key={idx} value={user}>{user}</option>
                ))}
              </select>
            </>
          )}

          {/* Date filters for all */}
          <input
            type="date"
            name="fromDate"
            className="border p-2 rounded"
            value={filters.fromDate}
            onChange={handleChange}
          />
          <input
            type="date"
            name="toDate"
            className="border p-2 rounded"
            value={filters.toDate}
            onChange={handleChange}
          />
        </div>
        
        <div className="text-right">
          <button onClick={clearFilters} className="text-sm text-blue-600 underline">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Request List */}
      {filteredRequests.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No requests found.</p>
      ) : (
        filteredRequests.map((request) => (
          <div key={request.id} className="bg-white shadow rounded-lg p-6 mb-4">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Request #{request.id}</h2>
                <p className="text-sm text-gray-600">Site: {request.site_name}</p>
                <p className="text-sm text-gray-600">
                  Request Date: {format(parseISO(request.request_date), 'MM/dd/yyyy HH:mm')}
                </p>
                <p className="text-sm text-gray-600">Requested by: {request.requested_by}</p>
                {request.user_role && (
                  <p className="text-sm text-gray-600">Role: {request.user_role}</p>
                )}
              </div>
              
              <div className="mt-2 md:mt-0 space-y-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  request.forwarded_to_ho ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {request.forwarded_to_ho ? 'Forwarded to HO' : 'Pending Forwarding'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Material</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Issued</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unit</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {request.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">{item.material_name}</td>
                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm">{item.issued_quantity ?? 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.unit_name} ({item.unit_symbol})
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(item.status)
                        }`}>
                          {item.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {request.remark && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Remarks:</span> {request.remark}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ListRequest;