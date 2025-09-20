/**
 * Copyright (c) 2025, Kirahi LLC
 * Max Seenisamy kirahi.com
 * 
 * Generic REST API accessors for CRUD and search
 */

/**
 * Fetches all rows from a specified table
 * @param {string} tableName - Name of the table to fetch rows from
 * @returns {Promise<Array>} Array of rows from the table
 * @throws {Error} If the API request fails
 */
async function fetchAllRows(tableName) {
    try {
        const response = await fetch(`/api/${encodeURIComponent(tableName)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching all rows:', error);
        throw new Error(`Failed to fetch rows from ${tableName}: ${error.message}`);
    }
}
  
/**
 * Fetches filtered rows from a specified table based on search criteria
 * @param {string} tableName - Name of the table to search in
 * @param {string} searchValue - Value to search for
 * @returns {Promise<Array>} Array of filtered rows
 * @throws {Error} If the API request fails
 */
async function fetchFilteredRows(tableName, searchValue) {
    try {
        const url = `/api/${encodeURIComponent(tableName)}/search/${encodeURIComponent(searchValue)}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching filtered rows:', error);
        throw new Error(`Failed to search rows in ${tableName}: ${error.message}`);
    }
}
  
/**
 * Creates a new row in the specified table
 * @param {string} tableName - Name of the table to create row in
 * @param {Object} payload - Data for the new row
 * @returns {Promise<Response>} API response object
 * @throws {Error} If the creation fails
 */
async function createRow(tableName, payload) {
    try {
        const response = await fetch(`/api/${encodeURIComponent(tableName)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Create failed: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error('Error creating row:', error);
        throw new Error(`Failed to create row in ${tableName}: ${error.message}`);
    }
}
  
/**
 * Updates an existing row in the specified table
 * @param {string} tableName - Name of the table containing the row
 * @param {string|number} pkValue - Primary key value of the row to update
 * @param {Object} payload - Updated data for the row
 * @returns {Promise<Response>} API response object
 * @throws {Error} If the update fails
 */
async function updateRow(tableName, pkValue, payload) {
    try {
        const response = await fetch(`/api/${encodeURIComponent(tableName)}/${encodeURIComponent(pkValue)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Update failed: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error('Error updating row:', error);
        throw new Error(`Failed to update row in ${tableName}: ${error.message}`);
    }
}
  
/**
 * Deletes a row from the specified table
 * @param {string} tableName - Name of the table containing the row
 * @param {string|number} pkValue - Primary key value of the row to delete
 * @returns {Promise<Response>} API response object
 * @throws {Error} If the deletion fails
 */
async function deleteRow(tableName, pkValue) {
    try {
        const response = await fetch(`/api/${encodeURIComponent(tableName)}/${encodeURIComponent(pkValue)}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`Deletion failed: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error('Error deleting row:', error);
        throw new Error(`Failed to delete row from ${tableName}: ${error.message}`);
    }
}
  
/**
 * Fetches table metadata including columns and primary key information
 * @param {string} tableName - Name of the table to get metadata for
 * @returns {Promise<Object>} Table metadata object with columns and primaryKey
 * @throws {Error} If the metadata request fails
 */
async function fetchTableMeta(tableName) {
    try {
        const response = await fetch(`/api/${encodeURIComponent(tableName)}/meta`);
        if (!response.ok) {
            throw new Error(`Failed to load metadata for ${tableName}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching table metadata:', error);
        throw new Error(`Failed to load metadata for ${tableName}: ${error.message}`);
    }
}

/**
 * Fetches all rows from a lookup table (e.g., units table)
 * @param {string} tableName - The lookup table name
 * @returns {Promise<Array>} Array of lookup values
 * @throws {Error} If the lookup request fails
 */
async function fetchLookupTable(tableName) {
    try {
        const response = await fetch(`/api/${encodeURIComponent(tableName)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${tableName}: ${response.statusText}`);
        }
        const data = await response.json();
        // Handle both array response and object with rows property
        return Array.isArray(data) ? data : (data.rows || []);
    } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    }
}
  
  export {
    fetchAllRows,
    fetchFilteredRows,
    createRow,
    updateRow,
    deleteRow,
    fetchTableMeta,
    fetchLookupTable
  };