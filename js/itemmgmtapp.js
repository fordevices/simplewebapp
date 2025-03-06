// first have to bring all the HTML Controls' values in
// Scraping HTML to both bring and send data back from Javascript for dynamic behavior

let newItemInput = "";
let newItemPriceInput = "";
let nameerror = "";
let priceerror = "";
let itemListnew = "";
let editeditem = 0;

// by default get all the items from the database during initial load and put it in the memory
// do not do this if you expect a large database
// this is a case where we do not expect more than 5000 rows at the end of life
// another risk is to keep this updated all the time, the app will perform CRUD

// --------BEGIN CLIENT SIDE JAVASCRIPT FUNCTION DEFINITIONS -----------
// function will display items in a table
// Source of data is the "global" variable allitemsjson

async function displayallitems () {
    try {
  
        // make the REST API Call to fetch all rows from the database
        // this will call the javascript code from server.js that will
        // query the database and get data (data in SQLite)
        // notice that both are written in Javascript

        const response = await fetch('/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${filterresponse.status}`);
        }
        const allitemsjson = await response.json();

        // for the HTML - table is my choice
        // you can replace the code below if you want a different control tp dsplay
        // there is no pagination - technical debt for later

        console.log('All Items JSON from DB ');
        console.log(allitemsjson);

        if (JSON.stringify(allitemsjson) === '{}') {
            throw new Error(`No Data Came back from the database`);
        }
        displaytable(allitemsjson);
    } catch (error) {
        console.error('Error retrieving data:', error);
        // Handle the error appropriately, e.g., display an error message or retry the operation
        throw error; // Re-throw the error to propagate it further if needed
    }
}
//  mostly replica of displayallitems Exceot fir the first 4 lines
//  the reason this is not a shared function between a query all items
//  is that, this executes db.all on the server vs a db.get
//  and they both have subtle differences in how to work with await
//  tech debt to figure that out and consolidate these functions

async function displayfiltereditems () {
    try {
        searchtextentered = document.getElementById('searchtext');
        let filterurl = '/search/'+searchtextentered.value;
        const filterresponse = await fetch(filterurl);
        if (!filterresponse.ok) {
            throw new Error(`HTTP error! status: ${filterresponse.status}`);
          }
        const filtereditemsjson = await filterresponse.json();

        console.log('Filtered JSON from DB ');
        console.log(filtereditemsjson);


        if (JSON.stringify(filtereditemsjson) === '{}') {
            throw new Error(`No Data Came back from the database`);
        }
        console.log('Filtered data converted to JSON Successfully:');
        displaytable(filtereditemsjson);

    } catch (error) {
        console.error('Error retrieving data:');
        // Handle the error appropriately, e.g., display an error message or retry the operation
        //throw error; // Re-throw the error to propagate it further if needed
    }
  }

// Add a new item to the database
async function addItem() {
    console.log("Got to Add Item with edieditem value of " + editeditem);
    const name = newItemInput.value;
    const price = newItemPriceInput.value;
    const productrow = {name, price};
    //console.log(productrow);
    console.log('Zero Comparision '+ (Number(editeditem) == 0));
    console.log('Greater than Zero Comparision '+ (Number(editeditem) > 0));

    if (Number(editeditem) == 0) {
        if (name && price) {
            await fetch('/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productrow)
            });
            //clear the Add new item data entry form
            resetForm();
            //refresh the page to show new items added
            displayallitems();
        }
    }
    if (Number(editeditem) > 0) {
        console.log('getting to make a PUT call')
        let puturl = '/products/'+Number(editeditem);
        let putresponse = '';
        putresponse = await fetch(puturl , {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productrow)
        });
        console.log('the PUT response we got is'+ putresponse.ok);
        if (putresponse.ok) {
            resetForm(); 
            displayallitems();
        }
        else {editeditem = 0; console.log("Deletion did not work" + putresponse.status)}
    }
}

async function editrow(e) {
    const selectedrow = e.parentElement.parentElement;
    // this is done to leverage the same form for both add and update
    if ( Number(selectedrow.children[0].innerHTML) > 0 ) 
         {editeditem = Number(selectedrow.children[0].innerHTML) }
    else { editeditem = 0 }
    console.log('Leaving editrow callback function with Item id is : ' + editeditem)
    // ONLY FOR DEBUGGING
    newItemInput = document.getElementById('itemnameinput');
    newItemPriceInput = document.getElementById('itempriceinput');
    newItemInput.value = selectedrow.children[1].innerHTML;
    newItemPriceInput.value = selectedrow.children[2].innerHTML
    console.log('Item Name '+selectedrow.children[1].innerHTML+' Price '+selectedrow.children[2].innerHTML);
}

async function deleterow(e) {
    const selectedrow = e.parentElement.parentElement;
    const idtodelete = selectedrow.children[0].innerHTML;
    let delresponse = '';
    let delurl = '';
    console.log(selectedrow.children[0].innerHTML);

    if (idtodelete) {
        delurl = '/products/'+idtodelete;
        delresponse = await fetch(delurl , {
            method: 'DELETE'
        });
        console.log('the DELETE response we got is'+delresponse.ok);
        if (delresponse.ok) {displayallitems();}
        else {console.log("Deletion did not work"+delresponse.status)}
    }
}

// Let's make sure the correct inputs are entered, validated
// and THEN submit the form to add a new item

function formValidation(){
    console.log("Got to Add Item Form Validation - First call");
    newItemInput = document.getElementById('itemnameinput');
    newItemPriceInput = document.getElementById('itempriceinput');
    nameerror = document.getElementById('nameerrormsg');
    priceerror = document.getElementById('priceerrormsg');

    if (newItemInput.value === "") {
        console.log("failure");
        nameerror.innerHTML = "Item Name cannot be blank";
    } else {
        console.log("success");
        nameerror.innerHTML = "";
        if ( (newItemPriceInput.value === "") || (! (isNumeric(newItemPriceInput.value)) )  )  {
            console.log("failure");
            priceerror.innerHTML = "Price has to be a valid number";
        } else {
            console.log("success");
            priceerror.innerHTML = "";
            //both succeeded now submit the new item
            //the funtion below will call the REST API to add the new item to DB
            addItem();
            //now dismiss
        }
    }
};

// Reset the Add New Item Form
function resetForm(){
    newItemInput.value = "";
    newItemPriceInput.value = "";
    editeditem = 0;
};

// Helper function to find out if a given string is a number
function isNumeric(str) {
    console.log(str);
    if (typeof str != "string") return false //if its already a number move on
    return !isNaN(str) &&          //  parse the string and remove whitespaces fully
            !isNaN(parseFloat(str)) 
}

function displaytable(initemsjson) {
    //just blindly displays the json reults
    
    itemListnew = document.getElementById('item-list-div');
    console.log("Well you are trying to display the table of rows");
    itemListnew.innerHTML = "";
    let tableHTML = '';
    //console.log("value of initemsjson.length : " + Object.keys(initemsjson).length());
    console.log("The JSON array to display " + initemsjson);
    tableHTML += '<div class="table">';
  
     // Create table header row
     console.log("just before object keys thing");
     const headers = Object.keys(initemsjson[0]);
     tableHTML += '<div class="row header-row">';
     console.log("just before iterating");
     headers.forEach(header => {
            tableHTML += `<span class="cell header-cell">${header}</span>`;
        });
        tableHTML += 
                `<span class=options">
                    <i onClick= "displayallitems()" class="fa-solid fa-compress"></i>
                    <i onClick ="displayallitems()" class="fa-solid fa-compress"></i>
                </span>`;
        tableHTML += '</div>';
        console.log("Header created");
    
        // Create table rows
        initemsjson.forEach(item => {
            tableHTML += '<div class="row">';
            headers.forEach(header => {
                tableHTML += `<span class="cell">${item[header]}</span>`;
            });
            tableHTML += 
                `<span class=options">
                    <i onClick= "editrow(this)" data-bs-toggle="modal" data-bs-target="#addnewitemform" class="fas fa-edit"></i>
                    <i onClick ="deleterow(this)" class="fas fa-trash-alt"></i>
                </span>`;
            tableHTML += '</div>';
        });
        itemListnew.innerHTML += tableHTML;
}

// --------END OF FUNCTION DEFINITIONS -----------