import axios from 'axios';
import AuthService from './AuthService';

class TransactionService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Transaction',
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
  async createSiteTransaction(data) {
    return this.axiosInstance.post('/CreateSiteTransaction', data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
  
  async issueMaterialTransaction(data) {
    return this.axiosInstance.post('/IssueMaterialTransaction', data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  // Get all transactions
  async getAllTransactions() {
    return this.axiosInstance.get('/GetAllTransactions');
  }



  async getSiteStock(site_id, material_id, unit_type_id) {
    return this.axiosInstance.get('/GetSiteStock', {
      params: { site_id, material_id, unit_type_id }
    });
  }
}

export default new TransactionService();
