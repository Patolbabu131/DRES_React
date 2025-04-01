import axios from 'axios';
import AuthService from './AuthService';


class UnitService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Units',
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

  async getAllUnits() {
    return this.axiosInstance.get('/GetAllUnits');
  }

  async createUnit(Data) {
    return this.axiosInstance.post('/CreateUnit', Data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async UpdateUnit (Id, Data) {
    return this.axiosInstance.put(`/UpdateUnit/${Id}`, Data, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getUnitById (Id) {
    return this.axiosInstance.get(`/GetUnitById/${Id}`);
  }

  async deleteUnit(Id) {
    return this.axiosInstance.delete(`/DeleteUnit/${Id}`);
  }
  
}

export default new UnitService();