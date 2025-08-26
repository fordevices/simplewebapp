// Generic REST API accessors for CRUD and search

async function fetchAllItems(tableName) {
    const response = await fetch(`/api/${encodeURIComponent(tableName)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
  
  async function fetchFilteredItems(tableName, searchValue) {
    const url = `/api/${encodeURIComponent(tableName)}/search/${encodeURIComponent(searchValue)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
  
  async function createItem(tableName, payload) {
    const response = await fetch(`/api/${encodeURIComponent(tableName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Create failed: ${response.status}`);
    }
    return response;
  }
  
  async function updateItem(tableName, pkValue, payload) {
    const response = await fetch(`/api/${encodeURIComponent(tableName)}/${encodeURIComponent(pkValue)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Update failed: ${response.status}`);
    }
    return response;
  }
  
  async function deleteItem(tableName, pkValue) {
    const response = await fetch(`/api/${encodeURIComponent(tableName)}/${encodeURIComponent(pkValue)}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Deletion failed: ${response.status}`);
    }
    return response;
  }
  
  async function fetchTableMeta(tableName) {
    const response = await fetch(`/api/${encodeURIComponent(tableName)}/meta`);
    if (!response.ok) {
      throw new Error(`Failed to load metadata for ${tableName}`);
    }
    return response.json();
  }
  
  export {
    fetchAllItems,
    fetchFilteredItems,
    createItem,
    updateItem,
    deleteItem,
    fetchTableMeta
  };  