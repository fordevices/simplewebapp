/**
 * Copyright (c) 2025, Kirahi LLC
 * Max Seenisamy kirahi.com
 * 
 * ES Module for field validation and error handling
 */

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Check if a field is empty
 * @param {string} value - The field value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateNotEmpty(value, fieldName) {
  if (!value || value.toString().trim() === '') {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }
  return true;
}

/**
 * Check if a field is a valid email format
 * @param {string} value - The field value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateEmail(value, fieldName) {
  if (value && value.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      throw new ValidationError(`${fieldName} must be a valid email address`, fieldName);
    }
  }
  return true;
}

/**
 * Check if a field is a valid number
 * @param {string|number} value - The field value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateNumber(value, fieldName) {
  if (value && value.toString().trim() !== '') {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      throw new ValidationError(`${fieldName} must be a valid number`, fieldName);
    }
  }
  return true;
}

/**
 * Check if a field is a valid integer
 * @param {string|number} value - The field value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateInteger(value, fieldName) {
  if (value && value.toString().trim() !== '') {
    const intValue = parseInt(value);
    if (isNaN(intValue) || !Number.isInteger(intValue)) {
      throw new ValidationError(`${fieldName} must be a valid integer`, fieldName);
    }
  }
  return true;
}

/**
 * Check if a field is valid text (non-empty string)
 * @param {string} value - The field value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateText(value, fieldName) {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} must be valid text`, fieldName);
  }
  return true;
}

/**
 * Check if a field is a valid decimal number
 * @param {string|number} value - The field value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateDecimal(value, fieldName) {
  if (value && value.toString().trim() !== '') {
    const decimalValue = parseFloat(value);
    if (isNaN(decimalValue)) {
      throw new ValidationError(`${fieldName} must be a valid decimal number`, fieldName);
    }
    // Check if it's a finite number (not Infinity)
    if (!isFinite(decimalValue)) {
      throw new ValidationError(`${fieldName} must be a finite decimal number`, fieldName);
    }
  }
  return true;
}

/**
 * Check if a field is a valid date
 * @param {string} value - The field value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateDate(value, fieldName) {
  if (value && value.toString().trim() !== '') {
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      throw new ValidationError(`${fieldName} must be a valid date (YYYY-MM-DD format)`, fieldName);
    }
    // Check if the date is reasonable (not too far in the past or future)
    const now = new Date();
    const year = dateValue.getFullYear();
    const currentYear = now.getFullYear();
    if (year < 1900 || year > currentYear + 100) {
      throw new ValidationError(`${fieldName} must be a reasonable date (between 1900 and ${currentYear + 100})`, fieldName);
    }
  }
  return true;
}

/**
 * Check if a field is a valid time in 24-hour format
 * @param {string} value - The field value to check
 * @param {string} fieldName - Name of the field for error messages
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateTime(value, fieldName) {
  if (value && value.toString().trim() !== '') {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value.trim())) {
      throw new ValidationError(`${fieldName} must be a valid time in 24-hour format (HH:MM)`, fieldName);
    }
  }
  return true;
}

/**
 * Validate a form field based on its type and requirements
 * @param {string} value - The field value
 * @param {string} fieldName - Name of the field
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether the field is required
 * @param {string} options.type - Field type ('text', 'email', 'number', 'integer')
 * @param {boolean} options.isPrimaryKey - Whether this is a primary key field
 * @returns {boolean} - True if valid, throws ValidationError if invalid
 */
export function validateField(value, fieldName, options = {}) {
  const { required = true, type = 'text', isPrimaryKey = false } = options;
  
  try {
    // Always check for empty if required
    if (required) {
      validateNotEmpty(value, fieldName);
    }
    
    // If field has a value, validate based on type
    if (value && value.toString().trim() !== '') {
      switch (type.toLowerCase()) {
        case 'email':
          validateEmail(value, fieldName);
          break;
        case 'number':
          validateNumber(value, fieldName);
          break;
        case 'integer':
          validateInteger(value, fieldName);
          break;
        case 'decimal':
          validateDecimal(value, fieldName);
          break;
        case 'date':
          validateDate(value, fieldName);
          break;
        case 'time':
          validateTime(value, fieldName);
          break;
        case 'text':
        default:
          validateText(value, fieldName);
          break;
      }
    }
    
    // Special validation for primary key fields
    if (isPrimaryKey && value && value.toString().trim() !== '') {
      validateNumber(value, fieldName);
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate multiple form fields
 * @param {Object} formData - Object containing field values
 * @param {Object} fieldConfigs - Configuration for each field
 * @returns {Object} - Validation result with errors array
 */
export function validateForm(formData, fieldConfigs) {
  const errors = [];
  
  for (const [fieldName, config] of Object.entries(fieldConfigs)) {
    try {
      validateField(formData[fieldName] || '', fieldName, config);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push({
          field: error.field,
          message: error.message
        });
      } else {
        errors.push({
          field: fieldName,
          message: error.message
        });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Display validation errors in the UI
 * @param {Array} errors - Array of validation errors
 * @param {string} scope - 'modal' or 'page'
 */
export function displayValidationErrors(errors, scope = 'modal') {
  try {
    // Clear previous errors
    clearValidationErrors(scope);
    
    if (errors.length === 0) return;
    
    // Group errors by field
    const fieldErrors = {};
    errors.forEach(error => {
      if (!fieldErrors[error.field]) {
        fieldErrors[error.field] = [];
      }
      fieldErrors[error.field].push(error.message);
    });
    
    // Display field-specific errors
    Object.entries(fieldErrors).forEach(([fieldName, messages]) => {
      const errorElement = document.getElementById(`err-${fieldName}`);
      if (errorElement) {
        errorElement.innerHTML = messages.join('<br>');
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '0.875rem';
      }
    });
    
    // Display general error message
    const generalErrorId = scope === 'modal' ? 'modal-error' : 'page-error';
    const generalErrorElement = document.getElementById(generalErrorId);
    if (generalErrorElement) {
      generalErrorElement.textContent = `Please fix ${errors.length} validation error(s)`;
    }
  } catch (error) {
    console.error('Error displaying validation errors:', error);
  }
}

/**
 * Clear all validation errors from the UI
 * @param {string} scope - 'modal' or 'page'
 */
export function clearValidationErrors(scope = 'modal') {
  try {
    // Clear field-specific errors
    const errorElements = document.querySelectorAll('[id^="err-"]');
    errorElements.forEach(element => {
      element.innerHTML = '';
    });
    
    // Clear general error message
    const generalErrorId = scope === 'modal' ? 'modal-error' : 'page-error';
    const generalErrorElement = document.getElementById(generalErrorId);
    if (generalErrorElement) {
      generalErrorElement.textContent = '';
      // Hide page error strip with animation
      if (scope === 'page' && generalErrorElement.classList.contains('page-error-strip')) {
        generalErrorElement.style.transform = 'translateY(100%)';
      }
    }
  } catch (error) {
    console.error('Error clearing validation errors:', error);
  }
}

/**
 * Generic error handler for displaying errors in the UI
 * @param {Error} err - The error to display
 * @param {Object} options - Display options
 * @param {string} options.scope - 'modal' or 'page'
 * @param {string} options.elementId - Custom element ID for page errors
 * @param {string} options.modalElementId - Custom element ID for modal errors
 */
export function handleError(err, options = {}) {
  try {
    const message = (err && err.message) ? err.message : String(err);
    const scope = options.scope || 'page';
    const pageId = options.elementId || 'page-error';
    const modalId = options.modalElementId || 'modal-error';
    
    if (scope === 'modal') {
      const el = document.getElementById(modalId);
      if (el) {
        el.textContent = message;
        el.style.display = 'block';
      }
    } else {
      // Use the new error message system
      if (typeof window.showError === 'function') {
        window.showError(message);
      } else {
        // Fallback to old system
        const el = document.getElementById(pageId);
        if (el) {
          el.textContent = message;
          el.style.display = 'block';
        }
      }
    }
    
    console.error(message);
  } catch (error) {
    console.error('Error in handleError function:', error);
  }
}

/**
 * Get field type based on field name patterns
 * @param {string} fieldName - The field name
 * @returns {string} - The inferred field type
 */
export function inferFieldType(fieldName) {
  const name = fieldName.toLowerCase();
  
  if (name.includes('email') || name.includes('mail')) {
    return 'email';
  }
  
  if (name.includes('date') || name.includes('deadline') || name.includes('target_date') || 
      name.includes('createdon') || name.includes('modifiedon')) {
    return 'date';
  }
  
  if (name.includes('time') || name.includes('timestamp') || name.includes('createdat') || 
      name.includes('updatedat')) {
    return 'time';
  }
  
  if (name.includes('id') || name.includes('count') || name.includes('number') || 
      name.includes('amount') || name.includes('quantity')) {
    return 'number';
  }
  
  if (name.includes('progress') || name.includes('percentage') || name.includes('score') ||
      name.includes('metric') || name.includes('value') || name.includes('rate') || 
      name.includes('ratio')) {
    return 'decimal';
  }
  
  return 'text';
}

/**
 * Create field configuration for validation
 * @param {Array} columns - Array of column names
 * @param {string} primaryKey - Primary key column name
 * @param {Function} [customFieldTypeInference] - Custom field type inference function
 * @returns {Object} - Field configuration object
 */
export function createFieldConfig(columns, primaryKey, customFieldTypeInference = null) {
  const config = {};
  
  columns.forEach(column => {
    const isPrimaryKey = column === primaryKey;
    const fieldType = customFieldTypeInference ? customFieldTypeInference(column) : inferFieldType(column);
    
    config[column] = {
      required: !isPrimaryKey, // Primary key fields are usually auto-generated
      type: fieldType,
      isPrimaryKey
    };
  });
  
  return config;
}

/**
 * Generic form validation and submission handler
 * @param {Map} formFields - Map of field names to DOM elements
 * @param {Object} tableMeta - Table metadata containing columns and primaryKey
 * @param {Function} submissionCallback - Function to call if validation passes
 * @param {string} scope - Error display scope ('modal' or 'page')
 * @param {Function} [customFieldTypeInference] - Custom field type inference function
 * @returns {Promise<boolean>} - True if validation passed and submission was attempted
 */
export async function validateAndSubmitForm(formFields, tableMeta, submissionCallback, scope = 'modal', customFieldTypeInference = null) {
  try {
    // Validate table metadata
    if (!tableMeta) {
      handleError(new Error('Table metadata not loaded'), { scope });
      return false;
    }
    
    // Gather form data
    const formData = {};
    formFields.forEach((element, fieldName) => {
      formData[fieldName] = element.value;
    });
    
    // Create field configuration for validation
    const fieldConfig = createFieldConfig(tableMeta.columns, tableMeta.primaryKey, customFieldTypeInference);
    
    // Validate form
    const validationResult = validateForm(formData, fieldConfig);
    
    if (!validationResult.isValid) {
      displayValidationErrors(validationResult.errors, scope);
      return false;
    }
    
    // Clear validation errors if validation passes
    clearValidationErrors(scope);
    
    // Submit the form
    await submissionCallback();
    return true;
    
  } catch (error) {
    handleError(error, { scope });
    return false;
  }
}
