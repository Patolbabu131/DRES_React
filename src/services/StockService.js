import axios from 'axios';
import AuthService from './AuthService';

class StockService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Stock',
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


  // Get all transactions
  async getAllStocks() {
    return this.axiosInstance.get('/GetAllStocks');
  }
}

export default new StockService();
