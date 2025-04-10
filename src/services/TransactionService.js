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
  async createTransaction(data) {
    return this.axiosInstance.post('/CreateTransaction', data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  // Get all transactions
  async getAllTransactions() {
    return this.axiosInstance.get('/GetAllTransactions');
  }
}

export default new TransactionService();
