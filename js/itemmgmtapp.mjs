/**
 * Copyright (c) 2025, Kirahi LLC
 * Max Seenisamy kirahi.com
 * 
 * ES Module for item management - Products Table in the database
 */
// this is the only MJS file that will be imported into the index.html file
// all the other MJS files will be imported into this file
// to change the table, you need to change the currentTable variable
// the only function that has any hardcoded table / col references is inferProductFieldType
// not trying to further split the code, because we need to maintain State in one place
// otherwise performance will be impaceted with several copies of the data in memory

import { 
    handleError, 
    clearValidationErrors, 
    validateAndSubmitForm,
    inferFieldType
} from './validation.mjs';
import {
    fetchAllRows,
    fetchFilteredRows,
    createRow,
    updateRow,
    deleteRow
} from './restcallsfordbdata.mjs';
import {
    buildDynamicForm,
    displaytable
} from './htmlhelpers.mjs';

// Global state for dynamic form handling
let currentTable = 'products';
let currentRows = [];
let editedItemPkValue = null;
// Global state for HTML rendering (moved from htmlhelpers.mjs)
let currentTableMeta = null;
let currentFormFields = new Map(); // Maps field names to their DOM elements

/**
 * Custom field type inference for products table
 * Extends the generic inference with product-specific field types
 * @param {string} fieldName - The field name
 * @returns {string} - The inferred field type
 */
function inferProductFieldType(fieldName) {
    const name = fieldName.toLowerCase();
    
    // Product-specific field type inference
    if (name.includes('price')) {
        return 'number';
    }
    
    // Use generic inference for other fields
    return inferFieldType(fieldName);
}

// by default get all the items from the database during initial load and put it in the memory
// do not do this if you expect a large database
// this is a case where we do not expect more than 5000 rows at the end of life
// another risk is to keep this updated all the time, the app will perform CRUD

// --------BEGIN CLIENT SIDE JAVASCRIPT FUNCTION DEFINITIONS -----------
// function will display items in a table
// Source of data is the "global" variable allitemsjson

/**
 * Displays all items from the specified table in a data table
 * @param {string} [tableName='products'] - Name of the table to display items from
 * @throws {Error} If fetching or displaying items fails
 */
async function displayallitems (tableName = 'products') {
    try {
        // Use the generic CRUD function from restcallsfordbdata.mjs
        // this is fetched once for all further interactions till another dtabase transaction
        // so we do not need to fetch the data again
        // if you expect a large database, you should not do this
        // this is a case where we do not expect more than 5000 rows at the end of life
        // another risk is to keep this updated all the time, the app will perform CRUD
        // on the database every time the app is loaded
        // this is a case where we do not expect more than 5000 rows at the end of life
        const allitemsjson = await fetchAllRows(tableName);

        console.log('All Items JSON from DB:', allitemsjson?.length || 0, 'items');

        if (!Array.isArray(allitemsjson) || allitemsjson.length === 0) {
            console.log('No data returned from database');
            currentRows = [];
            displaytable([]);
            return;
        }
        currentRows = allitemsjson;
        displaytable(allitemsjson, prepareEditForm, deleterow, () => displayallitems(currentTable));
    } catch (error) {
        console.error('Error displaying all items:', error);
        handleError(error, { scope: 'page' });
    }
}

/**
 * Displays filtered items from the specified table based on search criteria
 * not optimizing further because for more complex apps this may get complex
 * @param {string} [tableName='products'] - Name of the table to search in
 * @throws {Error} If searching or displaying filtered items fails
 */
async function displayfiltereditems (tableName = 'products') {
    try {
        const searchtextentered = document.getElementById('searchtext');
        if (!searchtextentered) {
            throw new Error('Search input element not found');
        }
        
        const searchValue = searchtextentered.value.trim();
        if (!searchValue) {
            // If no search term, just display all items
            displayallitems(tableName);
            return;
        }
        
        // Use the generic search function from restcallsfordbdata.mjs
        const filtereditemsjson = await fetchFilteredRows(tableName, searchValue);

        console.log('Filtered JSON from DB:', filtereditemsjson?.length || 0, 'items');

        if (!Array.isArray(filtereditemsjson) || filtereditemsjson.length === 0) {
            console.log('No matching results found');
            currentRows = [];
            displaytable([]);
            return;
        }
        currentRows = filtereditemsjson;
        console.log('Filtered data converted to JSON Successfully');
        displaytable(filtereditemsjson, prepareEditForm, deleterow, () => displayallitems(currentTable));

    } catch (error) {
        console.error('Error displaying filtered items:', error);
        handleError(error, { scope: 'page' });
    }
}

/**
 * Saves a row to the database - handles both insert and update operations
 * No HTML element name dependency, everyhing is dynamic and uses State Global Variables
 * Call REST API Abstracted in restcallsfordbdata.mjs
 * if you need to move away from REST API, you need to change the code in restcallsfordbdata.mjs
 * Determines create vs update based on editedItemPkValue state
 * @throws {Error} If form submission or database operation fails
 */
async function saveRow() {
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
            await createRow(currentTable, payload);
            console.log('Item created successfully');
        } else {
            // Update existing item
            console.log('Updating item with ID:', editedItemPkValue, 'payload:', payload);
            await updateRow(currentTable, editedItemPkValue, payload);
            console.log('Item updated successfully');
        }
        
        // Clear form and refresh display
        resetForm(); 
        displayallitems(currentTable);
        
        // Close modal properly
        closeModal();
        
    } catch (error) {
        console.error('Error adding/updating item:', error);
        handleError(error, { scope: 'modal' });
    }
}

/**
 * Prepares the edit form by populating it with existing row data and opening the modal
 * @param {number} rowIndex - Index of the row to edit
 * @throws {Error} If row index is invalid or modal operations fail
 */
async function prepareEditForm(rowIndex) {
    try {
        console.log('Preparing edit form for row at index:', rowIndex);
        
        if (rowIndex < 0 || rowIndex >= currentRows.length) {
            handleError(new Error('Invalid row index'), { scope: 'page' });
            return;
        }
        
        const rowData = currentRows[rowIndex];
        console.log('Row data to edit:', rowData);
        
        // Build dynamic form with current data and get metadata
        const { tableMeta, formFields } = await buildDynamicForm(currentTable, rowData);
        
        // Update global state
        currentTableMeta = tableMeta;
        currentFormFields = formFields;
        
        // Set the primary key value for update operation
        if (currentTableMeta && currentTableMeta.primaryKey) {
            editedItemPkValue = rowData[currentTableMeta.primaryKey];
        } else {
            editedItemPkValue = null;
        }
        
        // Get or create modal instance properly (safe bootstrap reference)
        const modalElement = document.getElementById('addnewitemform');
        if (!modalElement) {
            throw new Error('Modal element not found');
        }
        
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
        console.error('Error preparing edit form:', error);
        handleError(error, { scope: 'page' });
    }
}

/**
 * Deletes a row from the database after user confirmation
 * @param {number} rowIndex - Index of the row to delete
 * @throws {Error} If row index is invalid or deletion fails
 */
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
        await deleteRow(currentTable, pkValue);
        console.log('Item deleted successfully');
        displayallitems(currentTable);
        
    } catch (error) {
        console.error('Error deleting row:', error);
        handleError(error, { scope: 'page' });
    }
}

/**
 * Handles form submission with validation for adding/editing items
 * Uses the generic validation and submission function from validation.mjs
 * @throws {Error} If validation or submission fails
 */
async function handleFormSubmission(){
    try {
        console.log("Handling form submission for item addition/editing");
        
        // Use the generic validation and submission function with custom field type inference
        await validateAndSubmitForm(currentFormFields, currentTableMeta, saveRow, 'modal', inferProductFieldType);
    } catch (error) {
        console.error('Error in form submission:', error);
        handleError(error, { scope: 'modal' });
    }
};

/**
 * Resets the form by clearing all fields, edit state, and validation errors
 */
function resetForm(){
    try {
        // Clear all form fields
        currentFormFields.forEach((element, fieldName) => {
            element.value = '';
        });
        
        // Reset edit state
        editedItemPkValue = null;
        
        // Clear validation errors
        clearValidationErrors('modal');
    } catch (error) {
        console.error('Error resetting form:', error);
    }
};

/**
 * Properly closes the modal and cleans up Bootstrap modal state
 */
function closeModal() {
    try {
        const modalElement = document.getElementById('addnewitemform');
        if (!modalElement) {
            console.warn('Modal element not found for closing');
            return;
        }
        
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
        resetForm();
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

/**
 * Initialize dynamic form when "Add New" button is clicked and set up modal event handlers
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        const addNewBtn = document.getElementById('addNew');
        if (addNewBtn) {
            addNewBtn.addEventListener('click', async () => {
                try {
                    editedItemPkValue = null;
                    const { tableMeta, formFields } = await buildDynamicForm(currentTable);
                    currentTableMeta = tableMeta;
                    currentFormFields = formFields;
                } catch (error) {
                    console.error('Error initializing add new form:', error);
                    handleError(error, { scope: 'modal' });
                }
            });
        }
        
        // Ensure proper modal event handling
        const modalElement = document.getElementById('addnewitemform');
        if (modalElement) {
            // Handle modal hidden event to clean up
            modalElement.addEventListener('hidden.bs.modal', () => {
                try {
                    resetForm();
                    // Ensure backdrop is removed
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                    document.body.classList.remove('modal-open');
                    // Remove any remaining modal-open class
                    document.body.classList.remove('modal-open');
                } catch (error) {
                    console.error('Error in modal hidden event:', error);
                }
            });
            
            // Handle modal shown event to ensure proper focus
            modalElement.addEventListener('shown.bs.modal', () => {
                try {
                    // Focus on first input field
                    const firstInput = modalElement.querySelector('input');
                    if (firstInput) {
                        firstInput.focus();
                    }
                } catch (error) {
                    console.error('Error in modal shown event:', error);
                }
            });
        }
    } catch (error) {
        console.error('Error in DOMContentLoaded event:', error);
    }
});

// --------END OF FUNCTION DEFINITIONS -----------

// Export functions for use in other modules
export {
    displayallitems,
    displayfiltereditems,
    saveRow,
    prepareEditForm,
    deleterow,
    handleFormSubmission,
    resetForm,
    closeModal
};