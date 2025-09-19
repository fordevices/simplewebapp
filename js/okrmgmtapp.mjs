// ES Module for OKR management - OKR Table in the database
// this is the only MJS file that will be imported into the okr.html file
// all the other MJS files will be imported into this file
// to change the table, you need to change the currentTable variable
// the only function that has any hardcoded table / col references is inferOKRFieldType
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
let currentTable = 'okr';
let currentRows = [];
let editedItemPkValue = null;
// Global state for HTML rendering (moved from htmlhelpers.mjs)
let currentTableMeta = null;
let currentFormFields = new Map(); // Maps field names to their DOM elements

/**
 * Custom field type inference for OKR table
 * Extends the generic inference with OKR-specific field types
 * @param {string} fieldName - The field name
 * @returns {string} - The inferred field type
 */
function inferOKRFieldType(fieldName) {
    const name = fieldName.toLowerCase();
    
    // Unit field detection - custom business logic for OKRs
    if (name.includes('unit')) {
        return 'unit';
    }
    
    // Date field detection
    if (name.includes('date') || name.includes('deadline') || name.includes('target_date') || 
        name.includes('createdon') || name.includes('modifiedon')) {
        return 'date';
    }
    
    // Time field detection
    if (name.includes('time') || name.includes('timestamp') || name.includes('createdat') || 
        name.includes('updatedat')) {
        return 'time';
    }
    
    // Decimal/REAL field detection
    if (name.includes('progress') || name.includes('percentage') || name.includes('score') ||
        name.includes('metric') || name.includes('amount') || name.includes('value') ||
        name.includes('rate') || name.includes('ratio')) {
        return 'decimal';
    }
    
    // Use generic inference for other fields
    return inferFieldType(fieldName);
}

// by default get all the OKRs from the database during initial load and put it in the memory
// do not do this if you expect a large database
// this is a case where we do not expect more than 5000 rows at the end of life
// another risk is to keep this updated all the time, the app will perform CRUD

// --------BEGIN CLIENT SIDE JAVASCRIPT FUNCTION DEFINITIONS -----------
// function will display OKRs in a table
// Source of data is the "global" variable allokrsjson

/**
 * Displays all OKRs from the specified table in a data table
 * @param {string} [tableName='okr'] - Name of the table to display OKRs from
 * @throws {Error} If fetching or displaying OKRs fails
 */
async function displayallitems (tableName = 'okr') {
    try {
        // Use the generic CRUD function from restcallsfordbdata.mjs
        // this is fetched once for all further interactions till another dtabase transaction
        // so we do not need to fetch the data again
        // if you expect a large database, you should not do this
        // this is a case where we do not expect more than 5000 rows at the end of life
        // another risk is to keep this updated all the time, the app will perform CRUD
        // on the database every time the app is loaded
        // this is a case where we do not expect more than 5000 rows at the end of life
        const allokrsjson = await fetchAllRows(tableName);

        console.log('All OKRs JSON from DB:', allokrsjson?.length || 0, 'OKRs');

        if (!Array.isArray(allokrsjson) || allokrsjson.length === 0) {
            console.log('No data returned from database');
            currentRows = [];
            displaytable([]);
            return;
        }
        currentRows = allokrsjson;
        displaytable(allokrsjson, prepareEditForm, deleterow, () => displayallitems(currentTable));
    } catch (error) {
        console.error('Error displaying all OKRs:', error);
        handleError(error, { scope: 'page' });
    }
}

/**
 * Displays filtered OKRs from the specified table based on search criteria
 * not optimizing further because for more complex apps this may get complex
 * @param {string} [tableName='okr'] - Name of the table to search in
 * @throws {Error} If searching or displaying filtered OKRs fails
 */
async function displayfiltereditems (tableName = 'okr') {
    try {
        const searchtextentered = document.getElementById('searchtext');
        if (!searchtextentered) {
            throw new Error('Search input element not found');
        }
        
        const searchValue = searchtextentered.value.trim();
        if (!searchValue) {
            // If no search term, just display all OKRs
            displayallitems(tableName);
            return;
        }
        
        // Use the generic search function from restcallsfordbdata.mjs
        const filteredokrsjson = await fetchFilteredRows(tableName, searchValue);

        console.log('Filtered JSON from DB:', filteredokrsjson?.length || 0, 'OKRs');

        if (!Array.isArray(filteredokrsjson) || filteredokrsjson.length === 0) {
            console.log('No matching results found');
            currentRows = [];
            displaytable([]);
            return;
        }
        currentRows = filteredokrsjson;
        console.log('Filtered data converted to JSON Successfully');
        displaytable(filteredokrsjson, prepareEditForm, deleterow, () => displayallitems(currentTable));

    } catch (error) {
        console.error('Error displaying filtered OKRs:', error);
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
            // Create new OKR
            console.log('Creating new OKR with payload:', payload);
            await createRow(currentTable, payload);
            console.log('OKR created successfully');
        } else {
            // Update existing OKR
            console.log('Updating OKR with ID:', editedItemPkValue, 'payload:', payload);
            await updateRow(currentTable, editedItemPkValue, payload);
            console.log('OKR updated successfully');
        }
        
        // Clear form and refresh display
        resetForm(); 
        displayallitems(currentTable);
        
        // Close modal properly
        closeModal();
        
    } catch (error) {
        console.error('Error adding/updating OKR:', error);
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
        const { tableMeta, formFields } = await buildDynamicForm(currentTable, rowData, inferOKRFieldType);
        
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
        if (!confirm(`Are you sure you want to delete this OKR?`)) {
            return;
        }
        
        console.log('Deleting OKR with primary key:', pkValue);
        await deleteRow(currentTable, pkValue);
        console.log('OKR deleted successfully');
        displayallitems(currentTable);
        
    } catch (error) {
        console.error('Error deleting row:', error);
        handleError(error, { scope: 'page' });
    }
}

/**
 * Handles form submission with validation for adding/editing OKRs
 * Uses the generic validation and submission function from validation.mjs
 * @throws {Error} If validation or submission fails
 */
async function handleFormSubmission(){
    try {
        console.log("Handling form submission for OKR addition/editing");
        
        // Use the generic validation and submission function with custom field type inference
        await validateAndSubmitForm(currentFormFields, currentTableMeta, saveRow, 'modal', inferOKRFieldType);
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
                    const { tableMeta, formFields } = await buildDynamicForm(currentTable, null, inferOKRFieldType);
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
