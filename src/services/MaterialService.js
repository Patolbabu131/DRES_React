import axios from 'axios';
import AuthService from './AuthService';


class MaterilService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Materials',
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

  async getAllMaterials() {
    return this.axiosInstance.get('/GetAllMaterials');
  }

  async createMaterial(Data) {
    return this.axiosInstance.post('/CreateMaterial', Data, {
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

  async getMaterialById (Id) {
    return this.axiosInstance.get(`/GetMaterialById/${Id}`);
  }

  async deleteMaterial(Id) {
    return this.axiosInstance.delete(`/DeleteMaterial/${Id}`);
  }
  
}

export default new MaterilService();