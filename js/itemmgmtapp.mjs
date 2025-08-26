// ES Module for dynamic item management
import { 
    handleError, 
    validateForm, 
    displayValidationErrors, 
    clearValidationErrors, 
    createFieldConfig 
} from './validation.mjs';

// Global state for dynamic form handling
let currentTable = 'products';
let currentTableMeta = null;
let currentRows = [];
let editedItemPkValue = null;
let currentFormFields = new Map(); // Maps field names to their DOM elements

// by default get all the items from the database during initial load and put it in the memory
// do not do this if you expect a large database
// this is a case where we do not expect more than 5000 rows at the end of life
// another risk is to keep this updated all the time, the app will perform CRUD

// --------BEGIN CLIENT SIDE JAVASCRIPT FUNCTION DEFINITIONS -----------
// function will display items in a table
// Source of data is the "global" variable allitemsjson

async function displayallitems (tableName = 'products') {
    try {
        // Use the new dynamic REST API instead of hardcoded table names
        const response = await fetch(`/api/${encodeURIComponent(tableName)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allitemsjson = await response.json();

        console.log('All Items JSON from DB ');
        console.log(allitemsjson);

        if (!Array.isArray(allitemsjson) || allitemsjson.length === 0) {
            console.log('No data returned from database');
            currentRows = [];
            displaytable([]);
            return;
        }
        currentRows = allitemsjson;
        displaytable(allitemsjson);
    } catch (error) {
        handleError(error, { scope: 'page' });
    }
}
//  mostly replica of displayallitems Exceot fir the first 4 lines
//  the reason this is not a shared function between a query all items
//  is that, this executes db.all on the server vs a db.get
//  and they both have subtle differences in how to work with await
//  tech debt to figure that out and consolidate these functions

async function displayfiltereditems (tableName = 'products') {
    try {
        const searchtextentered = document.getElementById('searchtext');
        const searchValue = searchtextentered.value.trim();
        if (!searchValue) {
            // If no search term, just display all items
            displayallitems(tableName);
            return;
        }
        
        // Use the new dynamic search REST API
        let filterurl = `/api/${encodeURIComponent(tableName)}/search/${encodeURIComponent(searchValue)}`;
        const filterresponse = await fetch(filterurl);
        if (!filterresponse.ok) {
            throw new Error(`HTTP error! status: ${filterresponse.status}`);
          }
        const filtereditemsjson = await filterresponse.json();

        console.log('Filtered JSON from DB ');
        console.log(filtereditemsjson);

        if (!Array.isArray(filtereditemsjson) || filtereditemsjson.length === 0) {
            console.log('No matching results found');
            currentRows = [];
            displaytable([]);
            return;
        }
        currentRows = filtereditemsjson;
        console.log('Filtered data converted to JSON Successfully:');
        displaytable(filtereditemsjson);

    } catch (error) {
        handleError(error, { scope: 'page' });
    }
  }

// Add a new item to the database
async function addItem() {
    try {
        console.log("Processing form submission for table:", currentTable);
        
        // Gather all form field values dynamically
        const payload = {};
        let hasValues = false;
        
        currentFormFields.forEach((element, fieldName) => {
            const value = element.value.trim();
            if (value) {
                payload[fieldName] = value;
                hasValues = true;
            }
        });
        
        if (!hasValues) {
            handleError(new Error('Please fill in at least one field'), { scope: 'modal' });
            return;
        }
        
        // Determine if this is a create or update operation
        if (editedItemPkValue === null || editedItemPkValue === undefined || editedItemPkValue === '') {
            // Create new item
            console.log('Creating new item with payload:', payload);
            const response = await fetch(`/api/${encodeURIComponent(currentTable)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Create failed: ${response.status}`);
            }
            
            console.log('Item created successfully');
        } else {
            // Update existing item
            console.log('Updating item with ID:', editedItemPkValue, 'payload:', payload);
            const response = await fetch(`/api/${encodeURIComponent(currentTable)}/${encodeURIComponent(editedItemPkValue)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }
            
            console.log('Item updated successfully');
        }
        
        // Clear form and refresh display
        resetForm(); 
        displayallitems(currentTable);
        
        // Close modal properly
        closeModal();
        
    } catch (error) {
        handleError(error, { scope: 'modal' });
    }
}

async function editrow(rowIndex) {
    try {
        console.log('Editing row at index:', rowIndex);
        
        if (rowIndex < 0 || rowIndex >= currentRows.length) {
            handleError(new Error('Invalid row index'), { scope: 'page' });
            return;
        }
        
        const rowData = currentRows[rowIndex];
        console.log('Row data to edit:', rowData);
        
        // Set the primary key value for update operation
        if (currentTableMeta && currentTableMeta.primaryKey) {
            editedItemPkValue = rowData[currentTableMeta.primaryKey];
        } else {
            editedItemPkValue = null;
        }
        
        // Build dynamic form with current data
        await buildDynamicForm(rowData);
        
        // Get or create modal instance properly (safe bootstrap reference)
        const modalElement = document.getElementById('addnewitemform');
        const bs = window.bootstrap || undefined;
        let modal = bs && bs.Modal ? bs.Modal.getInstance(modalElement) : null;
        
        if (!modal && bs && bs.Modal) {
            modal = new bs.Modal(modalElement, {
                backdrop: true,
                keyboard: true,
                focus: true
            });
        }
        
        if (modal && typeof modal.show === 'function') {
            modal.show();
        } else {
            // Minimal fallback to display modal if bootstrap JS is unavailable
            modalElement.classList.add('show');
            modalElement.style.display = 'block';
            document.body.classList.add('modal-open');
        }
        
    } catch (error) {
        handleError(error, { scope: 'page' });
    }
}

async function deleterow(rowIndex) {
    try {
        console.log('Deleting row at index:', rowIndex);
        
        if (rowIndex < 0 || rowIndex >= currentRows.length) {
            handleError(new Error('Invalid row index'), { scope: 'page' });
            return;
        }
        
        const rowData = currentRows[rowIndex];
        let pkValue = null;
        
        // Get primary key value
        if (currentTableMeta && currentTableMeta.primaryKey) {
            pkValue = rowData[currentTableMeta.primaryKey];
        } else {
            handleError(new Error('No primary key found for deletion'), { scope: 'page' });
            return;
        }
        
        if (!pkValue && pkValue !== 0) {
            handleError(new Error('Invalid primary key value for deletion'), { scope: 'page' });
            return;
        }
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete this item?`)) {
            return;
        }
        
        console.log('Deleting item with primary key:', pkValue);
        const response = await fetch(`/api/${encodeURIComponent(currentTable)}/${encodeURIComponent(pkValue)}`, {
            method: 'DELETE'
        });
        
        console.log('Delete response status:', response.ok);
        if (response.ok) {
            console.log('Item deleted successfully');
            displayallitems(currentTable);
        } else {
            handleError(new Error(`Deletion failed: ${response.status}`), { scope: 'page' });
        }
        
    } catch (error) {
        handleError(error, { scope: 'page' });
    }
}

// Let's make sure the correct inputs are entered, validated
// and THEN submit the form to add a new item

function formValidation(){
    console.log("Form validation for dynamic form");
    
    // Gather form data
    const formData = {};
    currentFormFields.forEach((element, fieldName) => {
        formData[fieldName] = element.value;
    });
    
    // Create field configuration for validation
    if (!currentTableMeta) {
        handleError(new Error('Table metadata not loaded'), { scope: 'modal' });
        return;
    }
    
    const fieldConfig = createFieldConfig(currentTableMeta.columns, currentTableMeta.primaryKey);
    
    // Validate form
    const validationResult = validateForm(formData, fieldConfig);
    
    if (!validationResult.isValid) {
        displayValidationErrors(validationResult.errors, 'modal');
        return;
    }
    
    // Clear validation errors if validation passes
    clearValidationErrors('modal');
    
    // Submit the form
    try { 
        addItem(); 
    } catch (e) { 
        handleError(e, { scope: 'modal' }); 
    }
};

// Reset the Add New Item Form
function resetForm(){
    // Clear all form fields
    currentFormFields.forEach((element, fieldName) => {
        element.value = '';
    });
    
    // Reset edit state
    editedItemPkValue = null;
    
    // Clear validation errors
    clearValidationErrors('modal');
};

// Helper function to properly close modal and clean up
function closeModal() {
    const modalElement = document.getElementById('addnewitemform');
    const bs = window.bootstrap || undefined;
    const modal = bs && bs.Modal ? bs.Modal.getInstance(modalElement) : null;
    
    if (modal) {
        modal.hide();
    } else {
        // Fallback cleanup
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Remove all modal backdrops
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Remove any padding that Bootstrap might have added
        document.body.style.paddingRight = '';
    }
}

// Helper function to find out if a given string is a number
function isNumeric(str) {
    console.log(str);
    if (typeof str != "string") return false //if its already a number move on
    return !isNaN(str) &&          //  parse the string and remove whitespaces fully
            !isNaN(parseFloat(str)) 
}

function displaytable(initemsjson) {
    // Create table using DOM manipulation instead of HTML strings
    const itemListnew = document.getElementById('item-list-div');
    console.log("Well you are trying to display the table of rows");
    itemListnew.innerHTML = "";
    console.log("The JSON array to display " + initemsjson);

    // Handle empty array case
    if (!Array.isArray(initemsjson) || initemsjson.length === 0) {
        // Create empty table with default headers
        const tableContainer = createElement('div', { className: 'table' });
        tableContainer.classList.add('few-rows');
        
        // Create header row with default columns
        const headerRow = createElement('div', { className: 'row header-row' });
        const defaultHeaders = ['Name', 'Price']; // Default headers
        
        defaultHeaders.forEach(header => {
            const headerCell = createElement('span', { 
                className: 'cell header-cell',
                textContent: header 
            });
            headerRow.appendChild(headerCell);
        });

        // Add actions header
        const actionsHeader = createElement('span', { className: 'options' });
        const refreshIcon1 = createElement('i', { 
            className: 'fa-solid fa-compress',
            onclick: () => displayallitems()
        });
        const refreshIcon2 = createElement('i', { 
            className: 'fa-solid fa-compress',
            onclick: () => displayallitems()
        });
        actionsHeader.appendChild(refreshIcon1);
        actionsHeader.appendChild(refreshIcon2);
        headerRow.appendChild(actionsHeader);
        
        tableContainer.appendChild(headerRow);
        itemListnew.appendChild(tableContainer);
        return;
    }

    // Create main table container
    const tableContainer = createElement('div', { className: 'table' });
    
    // Add class for few rows to ensure top alignment
    if (initemsjson.length <= 2) {
        tableContainer.classList.add('few-rows');
    }
  
    // Create table header row
    console.log("just before object keys thing");
    const headers = Object.keys(initemsjson[0]);
    const headerRow = createElement('div', { className: 'row header-row' });
    console.log("just before iterating");

    // Add header cells
    headers.forEach(header => {
        const headerCell = createElement('span', { 
            className: 'cell header-cell',
            textContent: header 
        });
        headerRow.appendChild(headerCell);
    });

    // Add actions header
    const actionsHeader = createElement('span', { className: 'options' });
    const refreshIcon1 = createElement('i', { 
        className: 'fa-solid fa-compress',
        onclick: () => displayallitems()
    });
    const refreshIcon2 = createElement('i', { 
        className: 'fa-solid fa-compress',
        onclick: () => displayallitems()
    });
    actionsHeader.appendChild(refreshIcon1);
    actionsHeader.appendChild(refreshIcon2);
    headerRow.appendChild(actionsHeader);
        console.log("Header created");
    
    tableContainer.appendChild(headerRow);

    // Create table data rows
    initemsjson.forEach((item, index) => {
        const dataRow = createElement('div', { className: 'row' });

        // Add data cells
            headers.forEach(header => {
            const dataCell = createElement('span', { 
                className: 'cell',
                textContent: item[header] || ''
            });
            dataRow.appendChild(dataCell);
        });

        // Add action buttons
        const actionsCell = createElement('span', { className: 'options' });
        
        const editIcon = createElement('i', { 
            className: 'fas fa-edit',
            onclick: () => editrow(index)
        });
        
        const deleteIcon = createElement('i', { 
            className: 'fas fa-trash-alt',
            onclick: () => deleterow(index)
        });

        actionsCell.appendChild(editIcon);
        actionsCell.appendChild(deleteIcon);
        dataRow.appendChild(actionsCell);

        tableContainer.appendChild(dataRow);
    });

    itemListnew.appendChild(tableContainer);
}

// Helper function to create elements with properties
function createElement(tagName, properties = {}) {
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
}

// Helper function to load table metadata
async function loadTableMeta(tableName) {
    if (currentTableMeta && currentTableMeta.table === tableName) return;
    
    try {
        const response = await fetch(`/api/${encodeURIComponent(tableName)}/meta`);
        if (!response.ok) {
            throw new Error(`Failed to load metadata for ${tableName}`);
        }
        const meta = await response.json();
        currentTableMeta = { ...meta, table: tableName };
        console.log('Loaded table metadata:', currentTableMeta);
    } catch (error) {
        handleError(error, { scope: 'page' });
        throw error;
    }
}

// Build dynamic form based on table metadata
async function buildDynamicForm(rowData = null) {
    try {
        await loadTableMeta(currentTable);
        
        const modalBody = document.querySelector('#addnewitemform .modal-body');
        if (!modalBody) {
            throw new Error('Modal body not found');
        }
        
        // Clear existing form fields
        modalBody.innerHTML = '';
        currentFormFields.clear();
        
        // Get non-primary key columns for form fields
        const formColumns = currentTableMeta.columns.filter(col => col !== currentTableMeta.primaryKey);
        
        if (formColumns.length === 0) {
            modalBody.innerHTML = '<p class="text-muted">No editable fields available for this table.</p>';
            return;
        }
        
        // Create form fields dynamically
        formColumns.forEach(columnName => {
            // Create label
            const label = createElement('p', { textContent: columnName });
            modalBody.appendChild(label);
            
            // Create input field
            const input = createElement('input', {
                type: 'text',
                className: 'form-control',
                id: `field-${columnName}`,
                value: rowData ? (rowData[columnName] || '') : ''
            });
            modalBody.appendChild(input);
            
            // Create error div
            const errorDiv = createElement('div', { id: `err-${columnName}` });
            modalBody.appendChild(errorDiv);
            
            // Add line break
            const br = createElement('br');
            modalBody.appendChild(br);
            
            // Store reference to input field
            currentFormFields.set(columnName, input);
        });
        
        // Add error display area
        const errorArea = createElement('p', { 
            id: 'modal-error',
            className: 'text-danger small mt-2',
            role: 'alert',
            'aria-live': 'polite'
        });
        modalBody.appendChild(errorArea);
        
        console.log('Dynamic form built with fields:', Array.from(currentFormFields.keys()));
        
    } catch (error) {
        handleError(error, { scope: 'modal' });
    }
}

// Initialize dynamic form when "Add New" button is clicked
document.addEventListener('DOMContentLoaded', () => {
    const addNewBtn = document.getElementById('addNew');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', async () => {
            editedItemPkValue = null;
            await buildDynamicForm();
        });
    }
    
    // Ensure proper modal event handling
    const modalElement = document.getElementById('addnewitemform');
    if (modalElement) {
        // Handle modal hidden event to clean up
        modalElement.addEventListener('hidden.bs.modal', () => {
            resetForm();
            // Ensure backdrop is removed
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            // Remove any remaining modal-open class
            document.body.classList.remove('modal-open');
        });
        
        // Handle modal shown event to ensure proper focus
        modalElement.addEventListener('shown.bs.modal', () => {
            // Focus on first input field
            const firstInput = modalElement.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        });
    }
});

// --------END OF FUNCTION DEFINITIONS -----------

// Export functions for use in other modules
export {
    displayallitems,
    displayfiltereditems,
    addItem,
    editrow,
    deleterow,
    formValidation,
    resetForm,
    closeModal,
    displaytable,
    createElement,
    loadTableMeta,
    buildDynamicForm
};