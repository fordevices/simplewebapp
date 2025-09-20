# Building an OKR Management System Using the Generic Infrastructure

This guide explains how to build a complete OKR (Objectives and Key Results) management system using the existing generic infrastructure from the Item Management System.

## Overview

The infrastructure provides a complete CRUD system with:
- Dynamic form generation based on database schema
- Generic REST API endpoints
- Client-side validation
- Responsive Bootstrap UI
- Real-time search and filtering

## Prerequisites

1. **Database Setup**: Create an `okr` table in your SQLite database
2. **Optional Lookup Tables**: Create a `units` table for unit of measurement dropdowns
3. **File Structure**: Copy the existing infrastructure files

## Step 1: Database Schema

### Create the OKR Table

```sql
CREATE TABLE okr (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objective TEXT NOT NULL,
    keyresulttext TEXT,
    keyresultmetric REAL,
    keyresultmetricunit TEXT,
    targetdate DATE,
    progress REAL DEFAULT 0.0,
    status TEXT DEFAULT 'Not Started',
    createdon DATE DEFAULT CURRENT_DATE,
    modifiedon DATE DEFAULT CURRENT_DATE,
    modifiedtime TIME DEFAULT CURRENT_TIME
);
```

### Create the Units Table (Optional)

```sql
CREATE TABLE units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unitofmeasurement TEXT NOT NULL UNIQUE
);

-- Insert some sample units
INSERT INTO units (unitofmeasurement) VALUES 
('Percentage'), ('Count'), ('Hours'), ('Days'), ('Dollars'), ('Users');
```

## Step 2: Create the HTML Page

Create `okr.html` based on `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OKR Management System</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="kirahi-logo.png">
    
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="bootstrap-5.3.8-dist/css/bootstrap.min.css">
    <!-- FontAwesome -->
    <link rel="stylesheet" href="fontawesome-free-6.7.2-web/css/all.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand d-flex align-items-center" href="#">
                <img src="kirahi-logo.png" alt="Kirahi Logo" class="me-2" style="width: 48px; height: 48px; object-fit: contain;">
                <i class="fas fa-target me-2"></i>
                OKR Management
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="#">
                            <i class="fas fa-target me-1"></i>OKRs
                        </a>
                    </li>
                </ul>
                
                <!-- Search Form -->
                <form class="d-flex" id="searchform">
                    <div class="input-group">
                        <input class="form-control" type="search" id="searchtext" placeholder="Search OKRs..." aria-label="Search">
                        <button class="btn btn-outline-light" type="submit">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container-fluid" style="margin-top: 80px; padding-top: 20px;">
        <div class="row">
            <div class="col-12">
                <!-- Add New OKR Button -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="mb-0">
                        <i class="fas fa-list me-2"></i>OKRs List
                    </h4>
                    <button class="btn btn-success" id="addNew" data-bs-toggle="modal" data-bs-target="#addnewokrform">
                        <i class="fas fa-plus me-2"></i>Add New OKR
                    </button>
                </div>
                
                <!-- OKRs Table Container -->
                <div class="card">
                    <div class="card-body p-0">
                        <div id="okr-list-div"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Error Message Bar -->
    <div id="page-error" class="alert alert-danger alert-dismissible fade position-fixed bottom-0 start-0 w-100 m-0" role="alert" style="display: none; z-index: 1050;">
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <span id="error-message"></span>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <!-- Add New OKR Modal -->
    <div class="modal fade" id="addnewokrform" tabindex="-1" aria-labelledby="addOKRModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title d-flex align-items-center" id="addOKRModalLabel">
                        <img src="kirahi-logo.png" alt="Kirahi Logo" class="me-2" style="width: 36px; height: 36px; object-fit: contain;">
                        <i class="fas fa-plus-circle me-2"></i>Add New OKR
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                
                <form id="addOKRForm">
                    <div class="modal-body">
                        <!-- Dynamic form fields will be generated here -->
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save me-1"></i>Save OKR
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="bootstrap-5.3.8-dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Application Scripts -->
    <script type="module" src="okrmgmtapp.mjs"></script>
    <script type="module">
        import { 
            handleFormSubmission, 
            displayfilteredokrs, 
            displayallokrs 
        } from './okrmgmtapp.mjs';
        
        // Add new OKR form submission
        document.getElementById('addOKRForm').addEventListener("submit", (e) => {
            e.preventDefault();
            handleFormSubmission();
        });
        
        // Search form submission
        document.getElementById('searchform').addEventListener("submit", (e) => {
            e.preventDefault();
            displayfilteredokrs();
        });

        // Error message handling
        const errorAlert = document.getElementById('page-error');
        const errorMessage = document.getElementById('error-message');
        
        // Function to show error message
        window.showError = function(message) {
            errorMessage.textContent = message;
            errorAlert.style.display = 'block';
            errorAlert.classList.add('show');
        };
        
        // Function to hide error message
        window.hideError = function() {
            errorAlert.classList.remove('show');
            setTimeout(() => {
                errorAlert.style.display = 'none';
            }, 300);
        };
        
        // Auto-hide error after 5 seconds
        errorAlert.addEventListener('shown.bs.alert', function() {
            setTimeout(() => {
                hideError();
            }, 5000);
        });

        // Initialize the application by displaying all records in the db for the table
        displayallokrs();
    </script>
</body>
</html>
```

## Step 3: Create the OKR Management Application

Create `okrmgmtapp.mjs` based on `itemmgmtapp.mjs`:

```javascript
/**
 * OKR Management Application
 * Main application logic for managing OKRs using the generic infrastructure
 */

import { 
    loadTableMeta, 
    buildDynamicForm, 
    displaytable 
} from './htmlhelpers.mjs';

import { 
    fetchAllRows, 
    fetchFilteredRows, 
    createRow, 
    updateRow, 
    deleteRow 
} from './restcallsfordbdata.mjs';

import { 
    validateAndSubmitForm, 
    displayValidationErrors, 
    clearValidationErrors, 
    handleError 
} from './validation.mjs';

// Global state for OKR management
let currentTableMeta = null;
let currentFormFields = null;
let allokrsjson = [];
let filteredokrsjson = [];

// Table configuration
const currentTable = 'okr';

/**
 * Custom field type inference for OKR-specific fields
 * @param {string} fieldName - The name of the field
 * @param {string} fieldType - The database field type
 * @returns {string} - The inferred input type
 */
function inferOKRFieldType(fieldName, fieldType) {
    try {
        const lowerFieldName = fieldName.toLowerCase();
        
        // Decimal fields
        if (lowerFieldName.includes('progress') || 
            lowerFieldName.includes('percentage') || 
            lowerFieldName.includes('score') ||
            lowerFieldName.includes('metric')) {
            return 'decimal';
        }
        
        // Date fields
        if (lowerFieldName.includes('date') || 
            lowerFieldName.includes('deadline') ||
            lowerFieldName.includes('target_date')) {
            return 'date';
        }
        
        // Time fields
        if (lowerFieldName.includes('time') || 
            lowerFieldName.includes('timestamp')) {
            return 'time';
        }
        
        // Unit fields (for dropdowns)
        if (lowerFieldName.includes('unit')) {
            return 'unit';
        }
        
        // Default to text
        return 'text';
    } catch (error) {
        console.error('Error inferring OKR field type:', error);
        return 'text';
    }
}

/**
 * Initialize the OKR management application
 */
async function initializeOKRApp() {
    try {
        console.log('Initializing OKR Management Application...');
        
        // Load table metadata
        currentTableMeta = await loadTableMeta(currentTable);
        console.log('OKR table metadata loaded:', currentTableMeta);
        
        // Build dynamic form
        const formResult = await buildDynamicForm(
            currentTable, 
            currentTableMeta, 
            inferOKRFieldType
        );
        currentFormFields = formResult.formFields;
        
        console.log('OKR form initialized with fields:', currentFormFields);
        
    } catch (error) {
        console.error('Error initializing OKR app:', error);
        handleError('Failed to initialize OKR application', error);
    }
}

/**
 * Display all OKRs in the table
 */
async function displayallokrs() {
    try {
        console.log('Loading all OKRs...');
        
        // Initialize if not already done
        if (!currentTableMeta) {
            await initializeOKRApp();
        }
        
        // Fetch all OKRs
        allokrsjson = await fetchAllRows(currentTable);
        console.log('All OKRs loaded:', allokrsjson);
        
        // Display in table
        await displaytable(
            allokrsjson,
            currentTableMeta,
            prepareEditForm,
            deleterow,
            displayallokrs
        );
        
    } catch (error) {
        console.error('Error displaying all OKRs:', error);
        handleError('Failed to load OKRs', error);
    }
}

/**
 * Display filtered OKRs based on search criteria
 */
async function displayfilteredokrs() {
    try {
        const searchText = document.getElementById('searchtext').value.trim();
        console.log('Searching OKRs with text:', searchText);
        
        if (!searchText) {
            await displayallokrs();
            return;
        }
        
        // Initialize if not already done
        if (!currentTableMeta) {
            await initializeOKRApp();
        }
        
        // Fetch filtered OKRs
        filteredokrsjson = await fetchFilteredRows(currentTable, searchText);
        console.log('Filtered OKRs:', filteredokrsjson);
        
        // Display in table
        await displaytable(
            filteredokrsjson,
            currentTableMeta,
            prepareEditForm,
            deleterow,
            displayallokrs
        );
        
    } catch (error) {
        console.error('Error displaying filtered OKRs:', error);
        handleError('Failed to search OKRs', error);
    }
}

/**
 * Prepare the edit form with existing OKR data
 * @param {Object} okrData - The OKR data to edit
 */
async function prepareEditForm(okrData) {
    try {
        console.log('Preparing edit form for OKR:', okrData);
        
        // Initialize if not already done
        if (!currentTableMeta) {
            await initializeOKRApp();
        }
        
        // Build dynamic form with existing data
        const formResult = await buildDynamicForm(
            currentTable, 
            currentTableMeta, 
            inferOKRFieldType,
            okrData
        );
        currentFormFields = formResult.formFields;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('addnewokrform'));
        modal.show();
        
    } catch (error) {
        console.error('Error preparing edit form:', error);
        handleError('Failed to prepare edit form', error);
    }
}

/**
 * Delete an OKR row
 * @param {number} okrId - The ID of the OKR to delete
 */
async function deleterow(okrId) {
    try {
        console.log('Deleting OKR with ID:', okrId);
        
        if (!confirm('Are you sure you want to delete this OKR?')) {
            return;
        }
        
        await deleteRow(currentTable, okrId);
        console.log('OKR deleted successfully');
        
        // Refresh the display
        await displayallokrs();
        
    } catch (error) {
        console.error('Error deleting OKR:', error);
        handleError('Failed to delete OKR', error);
    }
}

/**
 * Save OKR data (insert or update)
 * @param {Object} okrData - The OKR data to save
 * @param {boolean} isUpdate - Whether this is an update operation
 */
async function saveRow(okrData, isUpdate = false) {
    try {
        console.log('Saving OKR:', okrData, 'isUpdate:', isUpdate);
        
        if (isUpdate) {
            await updateRow(currentTable, okrData.id, okrData);
            console.log('OKR updated successfully');
        } else {
            await createRow(currentTable, okrData);
            console.log('OKR created successfully');
        }
        
        // Refresh the display
        await displayallokrs();
        
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addnewokrform'));
        if (modal) {
            modal.hide();
        }
        
    } catch (error) {
        console.error('Error saving OKR:', error);
        handleError('Failed to save OKR', error);
    }
}

/**
 * Handle form submission for OKR creation/update
 */
async function handleFormSubmission() {
    try {
        console.log('Handling OKR form submission...');
        
        // Clear any previous validation errors
        clearValidationErrors();
        
        // Validate and submit the form
        await validateAndSubmitForm(
            currentFormFields,
            currentTableMeta,
            saveRow,
            'OKR',
            inferOKRFieldType
        );
        
    } catch (error) {
        console.error('Error handling form submission:', error);
        handleError('Failed to process form submission', error);
    }
}

// Initialize the application when the module loads
initializeOKRApp();

// Export functions for use in HTML
export {
    displayallokrs,
    displayfilteredokrs,
    prepareEditForm,
    deleterow,
    saveRow,
    handleFormSubmission
};
```

## Step 4: Server Configuration

The existing `server.js` already supports the OKR table through its generic endpoints:

- `GET /api/okr` - Fetch all OKRs
- `GET /api/okr/search?q=query` - Search OKRs
- `POST /api/okr` - Create new OKR
- `PUT /api/okr/:id` - Update existing OKR
- `DELETE /api/okr/:id` - Delete OKR

No server changes are needed!

## Step 5: Key Features

### Automatic Field Type Detection

The system automatically detects field types based on naming patterns:

- **Decimal fields**: `progress`, `percentage`, `score`, `metric`
- **Date fields**: `date`, `deadline`, `target_date`
- **Time fields**: `time`, `timestamp`
- **Unit fields**: `unit` (creates dropdown from units table)

### Dynamic Form Generation

Forms are automatically generated based on the database schema:

- Input types are inferred from field names
- Validation rules are applied automatically
- Date/time fields get appropriate pickers
- Unit fields get dropdowns populated from the units table

### Column Name Formatting

Database column names are automatically formatted for display:

- `keyresulttext` → "Key Result Text"
- `targetdate` → "Target Date"
- `keyresultmetricunit` → "Key Result Metric Unit"

### Real-time Search

The search functionality works across all text fields in the OKR table.

## Step 6: Customization Options

### Adding Custom Field Types

Extend the `inferOKRFieldType` function to add new field type patterns:

```javascript
function inferOKRFieldType(fieldName, fieldType) {
    const lowerFieldName = fieldName.toLowerCase();
    
    // Add your custom patterns here
    if (lowerFieldName.includes('priority')) {
        return 'select'; // For priority dropdowns
    }
    
    if (lowerFieldName.includes('description')) {
        return 'textarea'; // For longer text fields
    }
    
    // ... existing patterns
}
```

### Adding Custom Validation

Extend the validation in `validation.mjs` to add OKR-specific rules:

```javascript
// In validation.mjs, add to validateField function
case 'okr_progress':
    if (value < 0 || value > 100) {
        return 'Progress must be between 0 and 100';
    }
    break;
```

### Custom Styling

Add OKR-specific CSS classes in `style.css`:

```css
.okr-progress-bar {
    height: 20px;
    background-color: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
}

.okr-progress-fill {
    height: 100%;
    background-color: #28a745;
    transition: width 0.3s ease;
}
```

## Step 7: Deployment

1. **Copy Files**: Copy all the generic infrastructure files to your OKR project
2. **Database**: Set up your SQLite database with the OKR and units tables
3. **Configuration**: Update the `currentTable` variable in `okrmgmtapp.mjs`
4. **Start Server**: Run `node server.js` to start the application
5. **Access**: Open `okr.html` in your browser

## Benefits of This Approach

1. **Rapid Development**: Complete CRUD system in minutes
2. **Consistent UI**: Same look and feel as the item management system
3. **Maintainable**: Changes to infrastructure benefit all systems
4. **Extensible**: Easy to add new field types and validation rules
5. **Reusable**: Can create multiple management systems using the same infrastructure

## Troubleshooting

### Common Issues

1. **MIME Type Error**: Ensure `server.js` has the `.mjs` file handler
2. **Database Connection**: Verify the database file path in `server.js`
3. **Field Type Detection**: Check the `inferOKRFieldType` function for your field names
4. **Validation Errors**: Review the validation rules in `validation.mjs`

### Debug Tips

1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Use browser dev tools to inspect network requests
4. Verify database schema matches your expectations

This infrastructure provides a solid foundation for building any data management system with minimal custom code required.
