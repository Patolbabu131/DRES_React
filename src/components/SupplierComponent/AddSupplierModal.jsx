import { useState, useEffect } from 'react';
import ApiClient from '../../services/SupplerService';
import { useTheme } from '../context/ThemeContext';
import { AuthService } from '../../services/AuthService';
import { Toaster, toast } from 'react-hot-toast';

// Validation rules defined outside the component
const validationRules = {
  gst: {
    required: true,
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    message: {
      required: 'GST number is required',
      pattern: 'Invalid GST Number'
    }
  },
  company_name: {
    required: true,
    minLength: 3,
    message: {
      required: 'Company name is required',
      minLength: 'Company name must be at least 3 characters'
    }
  },
  phone1: {
    pattern: /^[6-9]\d{9}$/,
    message: {
      pattern: 'Please enter a valid Indian phone number'
    }
  },
};

const AddSupplierModal = ({ isOpen, onClose, onSuccess }) => {
  const { isDark } = useTheme();
  const initialFormData = {
    gst: '',
    company_name: '',
    contact_name: '',
    phone1: '',
    address: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isOpen]);

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
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const id = AuthService.getUserId();
      const response = await ApiClient.createSupplier({
        ...formData,
        createdbyid: id
      });
      if (onSuccess) onSuccess(response.data.data);
      setFormData(initialFormData);
      onClose();
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const clientMessage = serverMessage || error.message || 'Failed to create supplier';
      toast.error(clientMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Base input classes with responsive considerations
  const inputBaseClasses = `block w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
    isDark ? 'bg-darkBackground/20' : 'bg-lightBackground'
  }`;

  const getInputClasses = (fieldName) =>
    `${inputBaseClasses} ${
      errors[fieldName]
        ? 'border-red-500 focus:ring-red-500'
        : isDark
        ? 'border-gray-600 focus:ring-darkPrimary'
        : 'border-gray-300 focus:ring-lightPrimary'
    }`;

  return (
    <div
      role="dialog"
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-lg mx-auto rounded-xl p-6 sm:p-8 border overflow-y-auto max-h-[90vh] 
          ${isDark ? 'bg-darkSurface text-gray-100 border-darkPrimary/20' : 'bg-lightSurface text-gray-900 border-gray-200'} 
          shadow-lg transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl sm:text-2xl font-semibold mb-6">Add New Supplier</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GST No */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">
                GST No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="gst"
                value={formData.gst}
                onChange={handleChange}
                className={getInputClasses('gst')}
                aria-invalid={!!errors.gst}
                aria-describedby="gst-error"
                disabled={isSubmitting}
              />
              {errors.gst && (
                <p className="text-red-500 text-xs mt-1" id="gst-error">
                  {errors.gst}
                </p>
              )}
            </div>
            {/* Company Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className={getInputClasses('company_name')}
                aria-invalid={!!errors.company_name}
                aria-describedby="company_name-error"
                disabled={isSubmitting}
              />
              {errors.company_name && (
                <p className="text-red-500 text-xs mt-1" id="company_name-error">
                  {errors.company_name}
                </p>
              )}
            </div>
            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Name 
              </label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                className={getInputClasses('contact_name')}
                aria-invalid={!!errors.contact_name}
                aria-describedby="contact_name-error"
                disabled={isSubmitting}
              />
              {errors.contact_name && (
                <p className="text-red-500 text-xs mt-1" id="contact_name-error">
                  {errors.contact_name}
                </p>
              )}
            </div>
            {/* Phone 1 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone1"
                value={formData.phone1}
                onChange={handleChange}
                className={getInputClasses('phone1')}
                aria-invalid={!!errors.phone1}
                aria-describedby="phone1-error"
                disabled={isSubmitting}
              />
              {errors.phone1 && (
                <p className="text-red-500 text-xs mt-1" id="phone1-error">
                  {errors.phone1}
                </p>
              )}
            </div>
        
            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Address 
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={getInputClasses('address')}
                rows="3"
                disabled={isSubmitting}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1" id="address-error">
                  {errors.address}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-darkBackground/30 text-gray-300 hover:bg-darkBackground/50'
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
              }`}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <span className="mr-2">Saving</span>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                </div>
              ) : (
                'Add New Supplier'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplierModal;
