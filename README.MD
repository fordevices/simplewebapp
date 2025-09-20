# What are we building ?

## A Siimple Web App
### Using
    Node.JS
    Express.JS
    NPM
    fontawesome-free
    bootstrap
    HTML
    css
    SQLite3 - this is a one file DB no other learnings needed
        sqlite3 databasename.db < databaseschema.sql does the magic of creating a working database

### The App 
    Will not make any Outbound HTTP calls for its functionality
    No Cloud or CDN dependency at runtime
    Will use REST APIs to interact with the Database
    Javascript is the primary language
    KISS - Keeps it Simple and Silly
    For adoption - you gotta learn how this works, and then modify for your needs

### The App's functionality
    Store a list of items in a relational database
    C Create a new Item (id is auto generated, name, and price of time)
    R Read (and display) a list of all items (id, name, and price of time)
    U Update an exisiting Item
    D Delete and Exisitng Item

### Generic Infrastructure
    This application provides a complete generic infrastructure for building data management systems
    The infrastructure includes:
    - Dynamic form generation based on database schema
    - Generic REST API endpoints for any table
    - Client-side validation with extensible rules
    - Responsive Bootstrap UI components
    - Real-time search and filtering
    - Automatic field type detection and input generation
    
    See OKR_BUILDING_GUIDE.md for detailed instructions on how to build other management systems
    (like OKR management) using this same infrastructure.


## Where to start ?
    Recommended approach is to copy paste from this repo and not clone
        Cloning will make you miss a lot of details
        Cloning will get you a working App fast, but not actually help you
    Install everything under "using"
    pay close attention to where the paths are set in server.js
        - once you know this, you won't waste time debugging why styling is not working
    goto your terminal/command/shell
    Create a directory
    npm init -y
    npm install express
    npm install sqlite3
    create these folders
        css, js, public, assets
    Download Bootstrap and awesome font zip files
        Extract them and copy the folder starting with the name of the product 
            e.g. bootstrap-5.2.3-dist 
            e.g. fontawesome-free-6.7.2-web
        Paste those folders into the "assets" folder

    Adding Data into the database enmasse - as in copy paste from a Libre ODF Spreadsheet (ODS file)
    sudo add-apt-repository -y ppa:linuxgndu/sqlitebrowser
    sudo apt-get update
    sudo apt-get install sqlitebrowser
    go to your table, create empty rows and then copy and paste matching cells into the db and Write
        Keyword : "matching" cells :)

### NOTE : 
- There are many alternate ways to achieve the same result. 
- This is not ready for a large project. 
- This is not ready for production. 
- This just a sample app to help you get started fast.
- "Downloading" directly or through NPM is all you need the internet for to develop this
- The idea is for you to not have to depend on CDNs or some big Cloud provider
- The idea is for you to not depend on AI for smaller tasks
- The idea is for you to be smart about what and when to use AI for development