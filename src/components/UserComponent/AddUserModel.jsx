import { useState, useEffect } from 'react';
import ApiClient from '../../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import { AuthService } from '../../services/AuthService';
import { Toaster, toast } from 'react-hot-toast';
import UserService from '../../services/UserService';

// Validation rules moved outside to prevent re-creation on each render
const validationRules = {
  username: {
    required: true,
    minLength: 3,
    message: {
      required: 'Name is required',
      minLength: 'Must be at least 3 characters'
    }
  },
  phone: {
    required: true,
    pattern: /^[6-9]\d{9}$/,
    message: {
      required: 'Phone number is required',
      pattern: 'Please enter a valid Indian phone number'
    }
  },
  role: {
    required: true,
    message: {
      required: 'Role is required'
    }
  },
  siteId: {
    required: true,
    message: {
      required: 'Site is required'
    }
  }
};

// Role options with values that need to be sent to API
const roleOptions = [
  { id: 1, name: "Site Manager" },
  { id: 2, name: "Site Engineer" }
];

const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const { isDark } = useTheme();
  const initialFormData = { username: '', phone: '', role: '', siteId: '' };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [layout, setLayout] = useState('vertical');
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sites when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSites();
    }
  }, [isOpen]);

  // Fetch available sites
  const fetchSites = async () => {
    setIsLoading(true);
    try {
      const response = await ApiClient.getAllSites();
      setSites(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch sites');
      console.error('Error fetching sites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Optimized layout detection with debounce for better performance
  useEffect(() => {
    const handleResize = () => {
      const newLayout = window.innerWidth > 640 ? 'horizontal' : 'vertical';
      setLayout(newLayout);
    };

    // Initial check
    handleResize();

    // Debounced resize handler
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isOpen]);

  // Optimized validation function
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    if (rules.required && !value) return rules.message.required;
    if (rules.minLength && value.length < rules.minLength) return rules.message.minLength;
    if (rules.pattern && !rules.pattern.test(value)) return rules.message.pattern;

    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Only validate on change for fields the user has interacted with
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const validationErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) validationErrors[key] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = AuthService.getUserId();
      const response = await UserService.addUser({
        username: formData.username,
        phone: formData.phone,
        role: parseInt(formData.role),
        siteId: parseInt(formData.siteId),
        createdById: userId
      });

      if (onSuccess) onSuccess(response.data.data);
      setFormData(initialFormData);
      onClose();
      toast.success('User added successfully');
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const clientMessage = serverMessage || error.message || 'Failed to add user';
      toast.error(clientMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Pre-compute common class strings for better readability and performance
  const inputBaseClasses = `block w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
    isDark ? 'bg-darkBackground/20' : 'bg-lightBackground'
  }`;

  const getInputClasses = (fieldName) => `${inputBaseClasses} ${
    errors[fieldName]
      ? 'border-red-500 focus:ring-red-500' 
      : isDark 
        ? 'border-gray-600 focus:ring-darkPrimary' 
        : 'border-gray-300 focus:ring-lightPrimary'
  }`;

  return (
    <div 
      role="dialog"
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overscroll-contain"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    > 
      <div 
        className={`rounded-xl p-4 sm:p-6 w-full max-w-md mx-auto border overflow-y-auto max-h-[90vh]
          ${isDark ? 'bg-darkSurface text-gray-100 border-darkPrimary/20' : 'bg-lightSurface text-gray-900 border-gray-200'} 
          shadow-lg transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">
          Add New User
        </h2>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className={`${layout === 'horizontal' ? 'grid grid-cols-2 gap-4' : 'space-y-3'} mb-4`}>
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={getInputClasses('username')}
                aria-invalid={!!errors.username}
                aria-describedby="username-error"
                disabled={isSubmitting}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1" id="username-error">{errors.username}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={getInputClasses('phone')}
                aria-invalid={!!errors.phone}
                aria-describedby="phone-error"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1" id="phone-error">{errors.phone}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`${getInputClasses('role')} appearance-none`}
                aria-invalid={!!errors.role}
                disabled={isSubmitting}
              >
                <option value="" className={isDark ? 'bg-darkSurface text-gray-100' : 'bg-lightSurface text-gray-900'}>
                  Select Role
                </option>
                {roleOptions.map((role) => (
                  <option
                    key={role.id}
                    value={role.id}
                    className={isDark ? 'bg-darkSurface text-gray-100' : 'bg-lightSurface text-gray-900'}
                  >
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>

            {/* Site Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                name="siteId"
                value={formData.siteId}
                onChange={handleChange}
                className={`${getInputClasses('siteId')} appearance-none`}
                aria-invalid={!!errors.siteId}
                disabled={isSubmitting || isLoading}
              >
                <option value="" className={isDark ? 'bg-darkSurface text-gray-100' : 'bg-lightSurface text-gray-900'}>
                  {isLoading ? 'Loading sites...' : 'Select Site'}
                </option>
                {sites.map((site) => (
                  <option
                    key={site.id}
                    value={site.id}
                    className={isDark ? 'bg-darkSurface text-gray-100' : 'bg-lightSurface text-gray-900'}
                  >
                    {site.sitename}
                  </option>
                ))}
              </select>
              {errors.siteId && (
                <p className="text-red-500 text-xs mt-1">{errors.siteId}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors 
                ${isDark 
                  ? 'bg-darkBackground/30 text-gray-300 hover:bg-darkBackground/50' 
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}
              `}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <span className="mr-2">Saving</span>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                </div>
              ) : (
                'Add User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;