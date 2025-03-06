// --------BEGIN CLIENT SIDE JAVASCRIPT FUNCTION DEFINITIONS -----------
// function will display items in a table
// Source of data is the "global" variable allitemsjson

async function displaysecondmodule () {
    try {
  
        // make the REST API Call to fetch all rows from the database
        // this will call the javascript code from server.js that will
        // query the database and get data (data in SQLite)
        // notice that both are written in Javascript

        allitemsjson = [
            { "name": "Alice", "age": 30 },
            { "name": "Bob", "age": 25 },
            { "name": "Charlie", "age": 35 }
          ];

        // for the HTML - table is my choice
        // you can replace the code below if you want a different control tp dsplay
        // there is no pagination - technical debt for later

        //console.log('All Items JSON from DB ');
        //console.log(allitemsjson);
        //displayallseconditems();

        if (JSON.stringify(allitemsjson) === '{}') {
            throw new Error(`No Data Came back from the database`);
        }
        displaysecondtable(allitemsjson);
    } catch (error) {
        console.error('Error retrieving data:', error);
        // Handle the error appropriately, e.g., display an error message or retry the operation
        throw error; // Re-throw the error to propagate it further if needed
    }
}



function displaysecondtable(initemsjson) {
    //just blindly displays the json reults
    
    itemListnew = document.getElementById('item-list-div-second');
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