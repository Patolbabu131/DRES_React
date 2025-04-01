import axios from 'axios';
import AuthService from './AuthService';


class UserService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Suppliers',
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

  async getAllSupplier() {
    return this.axiosInstance.get('/GetAllSuppliers');
  }

  async createSupplier(Data) {
    return this.axiosInstance.post('/CreateSupplier', Data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async updateSupplier (Id, Data) {
    return this.axiosInstance.put(`/UpdateSupplier/${Id}`, Data, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  async deleteSite(siteId) {
    return this.axiosInstance.delete(`/Sites/DeleteSite/${siteId}`);
  }
  
}

export default new UserService();