import axios from 'axios';
import AuthService from './AuthService';


class UserService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://localhost:7022/api/Users',
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

  
  async getUserList(userId) {
    return this.axiosInstance.get(`/GetUserList/${userId}`);
  }


  async addUser(UserData) {
    return this.axiosInstance.post('/CreateUser', UserData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async updateSite(siteId, siteData) {
    return this.axiosInstance.put(`/Sites/UpdateSite/${siteId}`, siteData, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  async deleteSite(siteId) {
    return this.axiosInstance.delete(`/Sites/DeleteSite/${siteId}`);
  }
  
}

export default new UserService();