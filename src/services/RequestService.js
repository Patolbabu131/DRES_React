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

  async getRequests(userId) {
    return this.axiosInstance.get(`/GetRequests/${userId}`);
  }
  

  async createRequest(Data) {
    return this.axiosInstance.post('/CreateRequest', Data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

 
  
}

export default new RequestService();