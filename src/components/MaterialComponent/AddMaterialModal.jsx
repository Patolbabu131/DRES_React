import { useState, useEffect } from 'react';
import MaterialService from '../../services/MaterialService';
import { useTheme } from '../context/ThemeContext';
import { Toaster, toast } from 'react-hot-toast';

const validationRules = {
  material_name: {
    required: true,
    minLength: 3,
    message: {
      required: 'Material name is required',
      minLength: 'Must be at least 3 characters'
    }
  }
};

const AddMaterialModal = ({ isOpen, onClose, onSuccess }) => {
  const { isDark } = useTheme();
  const initialFormData = { material_name: '', remark: '' };
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isOpen]);

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    if (rules.required && !value.trim()) return rules.message.required;
    if (rules.minLength && value.length < rules.minLength) return rules.message.minLength;
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate field on change if defined in rules
    if (validationRules[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields before submission
    const validationErrors = {};
    Object.keys(validationRules).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) validationErrors[key] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await MaterialService.createMaterial(formData);
      if (onSuccess) onSuccess(response.data.data);
      onClose();
      toast.success('Material added successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create material';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      aria-modal="true"
    > 
      <div 
        className={`rounded-xl p-6 w-full max-w-md mx-auto border overflow-y-auto max-h-[90vh]
          ${isDark ? 'bg-darkSurface text-gray-100 border-darkPrimary/20' : 'bg-lightSurface text-gray-900 border-gray-200'} 
          shadow-lg transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-6">
          Add New Material
        </h2>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 mb-4">
            {/* Material Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Material Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="material_name"
                value={formData.material_name}
                onChange={handleChange}
                className={getInputClasses('material_name')}
                placeholder="Enter material name"
                aria-invalid={!!errors.material_name}
                disabled={isSubmitting}
              />
              {errors.material_name && (
                <p className="text-red-500 text-xs mt-1">{errors.material_name}</p>
              )}
            </div>

            {/* Remarks (Optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                className={`${inputBaseClasses} ${
                  isDark 
                    ? 'border-gray-600 focus:ring-darkPrimary' 
                    : 'border-gray-300 focus:ring-lightPrimary'
                }`}
                placeholder="Optional remarks"
                rows="3"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <span className="mr-2">Saving</span>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                </div>
              ) : (
                'Add Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterialModal;
