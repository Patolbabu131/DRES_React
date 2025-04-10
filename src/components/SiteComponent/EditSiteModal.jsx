import { useState, useEffect } from 'react';
import ApiClient from '../../services/ApiClient';
import { useTheme } from '../context/ThemeContext';
import { AuthService } from '../../services/AuthService';
import { Toaster, toast } from 'react-hot-toast';

// Moved the states array outside the component to prevent re-creation on each render
const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Jammu and Kashmir", "Ladakh"
];

// Validation rules moved outside to prevent re-creation on each render
const validationRules = {
  sitename: {
    required: true,
    minLength: 3,
    pattern: /^[a-zA-Z0-9 ]+$/,
    message: {
      required: 'Site name is required',
      minLength: 'Must be at least 3 characters',
      pattern: 'Special characters not allowed'
    }
  },
  siteaddress: {
    required: true,
    minLength: 5,
    pattern: /^[a-zA-Z, ]+$/,
    message: {
      required: 'Address is required',
      minLength: 'Must be at least 5 characters',
      pattern: 'Numbers/special chars not allowed'
    }
  },
  state: {
    required: true,
    message: 'State is required'
  }
};

const EditSiteModal = ({ isOpen, onClose, onSuccess, onError, site }) => {
  const { isDark } = useTheme();
  const initialFormData = { sitename: '', siteaddress: '', state: 'Gujarat', description: '' };
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [layout, setLayout] = useState('vertical');

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

  // Set form data when site data is available
  useEffect(() => {
    if (site) {
      setFormData({
        id: site.id,
        sitename: site.sitename,
        siteaddress: site.siteaddress,
        state: site.state,
        description: site.description || '',
      });
    }
  }, [site]);

  // Optimized validation function
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    if (rules.required && !value.trim()) return rules.message.required;
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
      if (key !== 'description' && key !== 'id') {
        const error = validateField(key, value);
        if (error) validationErrors[key] = error;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedbyid = AuthService.getUserId();
      const response = await ApiClient.updateSite(site.id, {
        ...formData,
        updatedbyid,
      });
      
      if (onSuccess) onSuccess(response.data.data);
      onClose();
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const clientMessage = serverMessage || error.message || 'Failed to update site';
      toast.error(clientMessage);
      if (onError) onError(clientMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !site) return null;

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
          Edit Site
        </h2>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className={`${layout === 'horizontal' ? 'grid grid-cols-2 gap-4' : 'space-y-3'} mb-4`}>
            {/* Sitename */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Sitename <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sitename"
                value={formData.sitename}
                onChange={handleChange}
                className={getInputClasses('sitename')}
                aria-invalid={!!errors.sitename}
                aria-describedby="sitename-error"
                disabled={isSubmitting}
              />
              {errors.sitename && (
                <p className="text-red-500 text-xs mt-1" id="sitename-error">{errors.sitename}</p>
              )}
            </div>

            {/* Siteaddress */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Siteaddress <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="siteaddress"
                value={formData.siteaddress}
                onChange={handleChange}
                className={getInputClasses('siteaddress')}
                aria-invalid={!!errors.siteaddress}
                aria-describedby="siteaddress-error"
                disabled={isSubmitting}
              />
              {errors.siteaddress && (
                <p className="text-red-500 text-xs mt-1" id="siteaddress-error">{errors.siteaddress}</p>
              )}
            </div>

            {/* State Field */}
            <div className={layout === 'horizontal' ? "col-span-2" : ""}>
              <label className="block text-sm font-medium mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`${getInputClasses('state')} appearance-none`}
                aria-invalid={!!errors.state}
                disabled={isSubmitting}
              >
                {states.map((state) => (
                  <option
                    key={state}
                    value={state}
                    className={isDark 
                      ? 'bg-darkSurface text-gray-100' 
                      : 'bg-lightSurface text-gray-900'
                    }
                  >
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}
            </div>

            {/* Description Field */}
            <div className={layout === 'horizontal' ? "col-span-2" : ""}>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={inputBaseClasses + ` ${isDark 
                  ? 'border-gray-600 focus:ring-darkPrimary' 
                  : 'border-gray-300 focus:ring-lightPrimary'
                }`}
                rows="2"
                disabled={isSubmitting}
              />
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
                  <span className="mr-2">Updating</span>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                </div>
              ) : (
                'Update Site'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSiteModal;