import { useState, useEffect } from 'react';
import ApiClient from '../../services/ApiClient';
import { useTheme } from '../context/ThemeContext';
import { AuthService } from '../../services/AuthService';
import { toast } from 'react-hot-toast';

const validationRules = {
  material_name: {
    required: true,
    minLength: 3,
    pattern: /^[a-zA-Z0-9 ]+$/,
    message: {
      required: 'Material name is required',
      minLength: 'Must be at least 3 characters',
      pattern: 'Special characters not allowed'
    }
  }
};

const EditMaterialModal = ({ isOpen, onClose, onSuccess, onError, material }) => {
  const { isDark } = useTheme();

  const initialFormData = {
    id: '',
    material_name: '',
    remark: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [layout, setLayout] = useState('vertical');

  useEffect(() => {
    const handleResize = () => {
      const newLayout = window.innerWidth > 640 ? 'horizontal' : 'vertical';
      setLayout(newLayout);
    };

    handleResize();

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

  useEffect(() => {
    if (material) {
      setFormData({
        id: material.id,
        material_name: material.material_name,
        remark: material.remark || ''
      });
    }
  }, [material]);

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';
    if (rules.required && (!value || value.toString().trim() === '')) return rules.message.required;
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
      if (key !== 'remark' && key !== 'id') {
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
      const response = await ApiClient.updateMaterial(material.id, {
        ...formData,
        updatedbyid,
      });
      if (onSuccess) onSuccess(response.data.data);
      onClose();
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const clientMessage = serverMessage || error.message || 'Failed to update material';
      toast.error(clientMessage);
      if (onError) onError(clientMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !material) return null;

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
        <h2 className="text-xl font-semibold mb-4">Edit Material</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`${layout === 'horizontal' ? 'grid grid-cols-1 gap-4' : 'space-y-3'} mb-4`}>
            <div>
              <label className="block text-sm font-medium mb-1">
                Material Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="material_name"
                value={formData.material_name}
                onChange={handleChange}
                className={getInputClasses('material_name')}
                aria-invalid={!!errors.material_name}
                aria-describedby="material_name-error"
                disabled={isSubmitting}
              />
              {errors.material_name && (
                <p className="text-red-500 text-xs mt-1" id="material_name-error">{errors.material_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Remark</label>
              <textarea
                name="remark"
                value={formData.remark}
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
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}
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
                'Update Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaterialModal;
