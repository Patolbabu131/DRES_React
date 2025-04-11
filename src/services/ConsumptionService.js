import axios from 'axios';
import AuthService from './AuthService';

class ConsumptionService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Consumption',
    });

    // Request interceptor for auth headers
    this.axiosInstance.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Create a new transaction
  async addConsumption(data) {
    return this.axiosInstance.post('/AddConsumption', data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
  


  // Get all transactions
  async getConsumption(userId) {
    return this.axiosInstance.get(`/GetConsumption/${userId}`);
  }
}

export default new ConsumptionService();
