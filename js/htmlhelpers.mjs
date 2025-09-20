/**
 * Copyright (c) 2025, Kirahi LLC
 * Max Seenisamy kirahi.com
 * 
 * HTML Helper functions for dynamic form and table rendering
 */
import { handleError } from './validation.mjs';
import { fetchTableMeta } from './restcallsfordbdata.mjs';

// Global state moved to itemmgmtapp.mjs

/**
 * Creates an actions header with refresh icons
 * @param {Function} refreshCallback - Callback function for refresh action
 * @returns {HTMLElement} Actions header element
 */
function createActionsHeader(refreshCallback) {
    const actionsHeader = createElement('span', { className: 'options' });
    const refreshIcon1 = createElement('i', { 
        className: 'fa-solid fa-compress',
        onclick: refreshCallback
    });
    const refreshIcon2 = createElement('i', { 
        className: 'fa-solid fa-compress',
        onclick: refreshCallback
    });
    actionsHeader.appendChild(refreshIcon1);
    actionsHeader.appendChild(refreshIcon2);
    return actionsHeader;
}

/**
 * Creates action buttons (edit and delete) for a table row
 * @param {number} index - Row index for the callbacks
 * @param {Function} prepareEditCallback - Callback function to prepare edit form
 * @param {Function} deleterowCallback - Callback function for delete action
 * @returns {HTMLElement} Actions cell element with edit and delete buttons
 */
function createActionButtons(index, prepareEditCallback, deleterowCallback) {
    const actionsCell = createElement('span', { className: 'options' });
    
    const editIcon = createElement('i', { 
        className: 'fas fa-edit',
        onclick: () => prepareEditCallback(index)
    });
    
    const deleteIcon = createElement('i', { 
        className: 'fas fa-trash-alt',
        onclick: () => deleterowCallback(index)
    });

    actionsCell.appendChild(editIcon);
    actionsCell.appendChild(deleteIcon);
    return actionsCell;
}

/**
 * Creates a DOM element with specified properties and attributes
 * @param {string} tagName - HTML tag name for the element
 * @param {Object} properties - Object containing element properties and attributes
 * @param {string} [properties.textContent] - Text content for the element
 * @param {string} [properties.innerHTML] - HTML content for the element
 * @param {string} [properties.className] - CSS class name(s) for the element
 * @param {Function} [properties.onclick] - Click event handler
 * @param {Object} [properties.dataset] - Data attributes object
 * @returns {HTMLElement} The created DOM element
 */
function createElement(tagName, properties = {}) {
    try {
        const element = document.createElement(tagName);
        
        // Set text content if provided
        if (properties.textContent !== undefined) {
            element.textContent = properties.textContent;
        }
        
        // Set inner HTML if provided
        if (properties.innerHTML !== undefined) {
            element.innerHTML = properties.innerHTML;
        }
        
        // Set class name if provided
        if (properties.className !== undefined) {
            element.className = properties.className;
        }
        
        // Set onclick if provided
        if (properties.onclick !== undefined) {
            element.onclick = properties.onclick;
        }
        
        // Set dataset attributes if provided
        if (properties.dataset !== undefined) {
            Object.keys(properties.dataset).forEach(key => {
                element.dataset[key] = properties.dataset[key];
            });
        }
        
        // Set any other attributes
        Object.keys(properties).forEach(key => {
            if (!['textContent', 'innerHTML', 'className', 'onclick', 'dataset'].includes(key)) {
                element.setAttribute(key, properties[key]);
            }
        });
        
        return element;
    } catch (error) {
        console.error('Error creating element:', error);
        throw new Error(`Failed to create ${tagName} element: ${error.message}`);
    }
}

/**
 * Loads and returns table metadata for a specified table
 * @param {string} tableName - Name of the table to load metadata for
 * @returns {Promise<Object>} Table metadata object with columns, primaryKey, and table name
 * @throws {Error} If metadata loading fails
 */
async function loadTableMeta(tableName) {
    try {
        const meta = await fetchTableMeta(tableName);
        const tableMeta = { ...meta, table: tableName };
        console.log('Loaded table metadata:', tableMeta);
        return tableMeta;
    } catch (error) {
        console.error('Error loading table metadata:', error);
        handleError(error, { scope: 'page' });
        throw error;
    }
}

/**
 * Creates a dropdown select element for unit fields
 * @param {string} columnName - The column name
 * @param {Object} rowData - Optional existing row data
 * @returns {Promise<HTMLElement>} The select element
 * @throws {Error} If dropdown creation fails
 */
async function createUnitDropdown(columnName, rowData = null) {
    try {
        // Import fetchLookupTable dynamically to avoid circular imports
        const { fetchLookupTable } = await import('./restcallsfordbdata.mjs');
        
        // Fetch units from the units table
        const units = await fetchLookupTable('units');
        
        // Create select element
        const select = createElement('select', {
            className: 'form-control',
            id: `field-${columnName}`
        });
        
        // Add default option
        const defaultOption = createElement('option', {
            value: '',
            textContent: 'Select a unit...'
        });
        select.appendChild(defaultOption);
        
        // Add unit options
        let optionCount = 0;
        units.forEach(unit => {
            // Handle the actual units table structure with 'unitofmeasurement' column
            const unitName = unit.unitofmeasurement || unit.name || unit.unit_name || unit.unit || unit.value;
            
            // Skip null or empty unit names
            if (!unitName || unitName.trim() === '') {
                return;
            }
            
            // Use the unit name as both value and display text (not the ID)
            const option = createElement('option', {
                value: unitName,  // Save the actual unit text, not the ID
                textContent: unitName
            });
            
            // Select current value if editing
            if (rowData && rowData[columnName] == unitName) {
                option.selected = true;
            }
            
            select.appendChild(option);
            optionCount++;
        });
        
        
        return select;
    } catch (error) {
        console.error('Error creating unit dropdown:', error);
        // Fallback to text input if units table is not available
        const input = createElement('input', {
            type: 'text',
            className: 'form-control',
            id: `field-${columnName}`,
            value: rowData ? (rowData[columnName] || '') : '',
            placeholder: 'Enter unit (units table not available)'
        });
        return input;
    }
}

/**
 * Builds a dynamic form based on table metadata and populates it with existing data if provided
 * @param {string} tableName - Name of the table to build form for
 * @param {Object} [rowData=null] - Existing row data to populate the form with
 * @param {Function} [customFieldTypeInference=null] - Optional custom field type inference function
 * @returns {Promise<Object>} Object containing tableMeta and formFields Map
 * @throws {Error} If form building fails
 */
async function buildDynamicForm(tableName, rowData = null, customFieldTypeInference = null) {
    try {
        const tableMeta = await loadTableMeta(tableName);
        
        const modalBody = document.querySelector('.modal-body');
        if (!modalBody) {
            throw new Error('Modal body not found');
        }
        
        // Clear existing form fields
        modalBody.innerHTML = '';
        const formFields = new Map();
        
        // Get non-primary key columns for form fields
        const formColumns = tableMeta.columns.filter(col => {
            if (col === tableMeta.primaryKey) return false;
            return true;
        });
        
        if (formColumns.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">No editable fields available for this table.</p>';
            return { tableMeta, formFields };
        }
        
        // Create form fields dynamically
        for (const columnName of formColumns) {
            // Create label
            const label = createElement('p', { textContent: formatColumnNameForDisplay(columnName) });
            modalBody.appendChild(label);
            
            // Determine field type using custom inference if provided
            let fieldType = 'text';
            if (customFieldTypeInference) {
                fieldType = customFieldTypeInference(columnName);
            } else {
                // Default field type inference
                const fieldName = columnName.toLowerCase();
                if (fieldName.includes('date') || fieldName.includes('deadline') || fieldName.includes('target_date') || 
                    fieldName.includes('createdon') || fieldName.includes('modifiedon')) {
                    fieldType = 'date';
                } else if (fieldName.includes('time') || fieldName.includes('timestamp') || fieldName.includes('createdat') || 
                           fieldName.includes('updatedat')) {
                    fieldType = 'time';
                }
            }
            
            let inputElement;
            
            // Handle unit fields with dropdown
            if (fieldType === 'unit') {
                inputElement = await createUnitDropdown(columnName, rowData);
            } else {
                // Handle other field types
                let inputType = 'text';
                let inputValue = rowData ? (rowData[columnName] || '') : '';
                
                switch (fieldType) {
                    case 'date':
                        inputType = 'date';
                        // Force modifiedon to current date when editing, otherwise set default to today's date
                        if (columnName === 'modifiedon' && rowData) {
                            const today = new Date();
                            inputValue = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                        } else if (!inputValue) {
                            const today = new Date();
                            inputValue = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                        } else if (inputValue && inputValue.includes(' ')) {
                            inputValue = inputValue.split(' ')[0]; // Take only the date part
                        }
                        break;
                    case 'time':
                        inputType = 'time';
                        // Force modifiedtime to current time when editing, otherwise set default to current time
                        if (columnName === 'modifiedtime' && rowData) {
                            const now = new Date();
                            inputValue = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
                        } else if (!inputValue) {
                            const now = new Date();
                            inputValue = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
                        } else if (inputValue && inputValue.includes(' ')) {
                            const timePart = inputValue.split(' ')[1];
                            if (timePart) {
                                inputValue = timePart.substring(0, 5); // Take HH:MM part
                            }
                        }
                        break;
                    default:
                        inputType = 'text';
                        break;
                }
                
                // Create input field
                inputElement = createElement('input', {
                    type: inputType,
                    className: 'form-control',
                    id: `field-${columnName}`,
                    value: inputValue
                });
            }
            
            modalBody.appendChild(inputElement);
            
            // Create error div
            const errorDiv = createElement('div', { id: `err-${columnName}` });
            modalBody.appendChild(errorDiv);
            
            // Add line break
            const br = createElement('br');
            modalBody.appendChild(br);
            
            // Store reference to input field
            formFields.set(columnName, inputElement);
        }
        
        // Add error display area
        const errorArea = createElement('p', { 
            id: 'modal-error',
            className: 'text-danger small mt-2',
            role: 'alert',
            'aria-live': 'polite'
        });
        modalBody.appendChild(errorArea);
        
        console.log('Dynamic form built with fields:', Array.from(formFields.keys()));
        
        return { tableMeta, formFields };
        
    } catch (error) {
        console.error('Error building dynamic form:', error);
        handleError(error, { scope: 'modal' });
        throw error;
    }
}

/**
 * Displays a table of rows with edit/delete functionality
 * @param {Array} rowsData - Array of rows to display in the table
 * @param {Function} prepareEditCallback - Callback function to prepare edit form
 * @param {Function} deleterowCallback - Callback function for delete row action
 * @param {Function} refreshCallback - Callback function for refresh action
 * @throws {Error} If table display fails
 */
function displaytable(rowsData, prepareEditCallback, deleterowCallback, refreshCallback) {
    try {
        // Create table using DOM manipulation instead of HTML strings
        const tableContainer = document.getElementById('item-list-div');
        if (!tableContainer) {
            throw new Error('Table container not found');
        }
        
        console.log("Displaying table with", rowsData?.length || 0, "rows");
        tableContainer.innerHTML = "";

        // Handle empty array case
        if (!Array.isArray(rowsData) || rowsData.length === 0) {
            // Create a message container instead of empty table
            const messageContainer = createElement('div', { 
                className: 'text-center py-5',
                style: 'background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;'
            });
            
            const icon = createElement('i', { 
                className: 'fas fa-inbox fa-3x text-muted mb-3',
                style: 'display: block;'
            });
            
            const title = createElement('h5', { 
                className: 'text-muted mb-2',
                textContent: 'No Data Available'
            });
            
            const message = createElement('p', { 
                className: 'text-muted mb-0',
                textContent: 'There are no records to display. Click "Add New" to create your first record.'
            });
            
            messageContainer.appendChild(icon);
            messageContainer.appendChild(title);
            messageContainer.appendChild(message);
            tableContainer.appendChild(messageContainer);
            return;
        }

        // Create main table container
        const tableElement = createElement('div', { className: 'table' });
        
        // Add class for few rows to ensure top alignment
        if (rowsData.length <= 2) {
            tableElement.classList.add('few-rows');
        }
      
        // Create table header row
        const headers = Object.keys(rowsData[0]);
        const headerRow = createElement('div', { className: 'row header-row' });

        // Add header cells
        headers.forEach(header => {
            const headerCell = createElement('span', { 
                className: 'cell header-cell',
                textContent: formatColumnNameForDisplay(header)
            });
            headerRow.appendChild(headerCell);
        });

        // Add actions header
        const actionsHeader = createActionsHeader(refreshCallback);
        headerRow.appendChild(actionsHeader);
        
        tableElement.appendChild(headerRow);

        // Create table data rows
        rowsData.forEach((row, index) => {
            const dataRow = createElement('div', { className: 'row' });

            // Add data cells
            headers.forEach(header => {
                const dataCell = createElement('span', { 
                    className: 'cell',
                    textContent: row[header] || ''
                });
                dataRow.appendChild(dataCell);
            });

            // Add action buttons
            const actionsCell = createActionButtons(index, prepareEditCallback, deleterowCallback);
            dataRow.appendChild(actionsCell);

            tableElement.appendChild(dataRow);
        });

        tableContainer.appendChild(tableElement);
        
    } catch (error) {
        console.error('Error displaying table:', error);
        const tableContainer = document.getElementById('item-list-div');
        if (tableContainer) {
            tableContainer.innerHTML = '<p class="text-danger">Error displaying table data</p>';
        }
        throw new Error(`Failed to display table: ${error.message}`);
    }
}

// Getter functions removed - state is now managed in itemmgmtapp.mjs

/**
 * Formats a column name for display by splitting camelCase/underscore_separated words and capitalizing each word
 * @param {string} columnName - The column name to format
 * @returns {string} - Formatted display name
 */
function formatColumnNameForDisplay(columnName) {
    try {
        // Handle camelCase: insert space before capital letters
        let formatted = columnName.replace(/([a-z])([A-Z])/g, '$1 $2');
        
        // Handle underscores: replace with spaces
        formatted = formatted.replace(/_/g, ' ');
        
        // Handle common compound words by inserting spaces before specific patterns
        formatted = formatted.replace(/([a-z])([A-Z][a-z]*)/g, '$1 $2');
        
        // Handle specific patterns for better readability
        formatted = formatted.replace(/(key)(result|metric)/gi, '$1 $2');
        formatted = formatted.replace(/(target)(date)/gi, '$1 $2');
        formatted = formatted.replace(/(created)(on)/gi, '$1 $2');
        formatted = formatted.replace(/(modified)(on|time)/gi, '$1 $2');
        formatted = formatted.replace(/(unit)(of|measurement)/gi, '$1 $2');
        
        // Handle more specific compound patterns
        formatted = formatted.replace(/(key)(result)(text)/gi, '$1 $2 $3');
        formatted = formatted.replace(/(key)(result)(metric)/gi, '$1 $2 $3');
        formatted = formatted.replace(/(result)(text)/gi, '$1 $2');
        formatted = formatted.replace(/(result)(metric)/gi, '$1 $2');
        
        // Handle specific typos or variations
        formatted = formatted.replace(/keyreesulttext/gi, 'Key Result Text');
        formatted = formatted.replace(/keyreesultmetric/gi, 'Key Result Metric');
        
        // Handle multiple spaces: replace with single space
        formatted = formatted.replace(/\s+/g, ' ');
        
        // Capitalize first letter of each word
        formatted = formatted.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        
        return formatted.trim();
    } catch (error) {
        console.error('Error formatting column name:', error);
        return columnName; // Return original if formatting fails
    }
}

// Export functions for use in other modules
export {
    createElement,
    loadTableMeta,
    buildDynamicForm,
    displaytable,
    formatColumnNameForDisplay
};