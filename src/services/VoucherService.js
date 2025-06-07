import axios from 'axios';
import AuthService from './AuthService';

class VoucherService{
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Voucher',
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
 
  // 1) Consumption voucher details
  async getConsumptionVoucherDetails(id) {
    return this.axiosInstance.get(`/ConsumptionVoucherDetails/${id}`);
  }

  // 2) Inward voucher
  async getInwardVoucher(id) {
    return this.axiosInstance.get(`/InwardVoucherDetails/${id}`);
  }

  // 3) Issue to site
  async getIssueToSite(id) {
    return this.axiosInstance.get(`/IssueToSiteVoucherDetails/${id}`);
  }

  // 4) Issue to engineer
  async getIssueToEngineer(id) {
    return this.axiosInstance.get(`/IssueToEngineerVoucherDetails/${id}`);
  }




}

export default new VoucherService();
