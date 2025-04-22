import axios from 'axios';
import AuthService from './AuthService';


class RequestService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Material_Request',
    });

    // Add request interceptor for auth headers
    this.axiosInstance.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getRequestsList(userId) {
    return this.axiosInstance.get(`/GetRequestsList/${userId}`);
  }
  
  async rejectRequest(requestId, userId) {
    return this.axiosInstance.put(`/RejectRequest/${requestId}/${userId}`);
  }

  async dropdownRequestList(userId) {
    return this.axiosInstance.get(`/DropdownRequestList/${userId}`);
  }

  async getRequestDetails(request_id)
  {
    return this.axiosInstance.get(`/GetRequestDetails/${request_id}`);
  }
  
  async createRequest(Data) {
    return this.axiosInstance.post('/CreateRequest', Data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

   async forwardToHO(requestId, userId) {
    return this.axiosInstance.put(`/ForwardToHO/${requestId}/${userId}`);
  }
  
}

export default new RequestService();











 