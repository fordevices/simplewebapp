const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 9785;

const db = new sqlite3.Database('./products.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the Items Management Database - products.db SQLite Db File');
});

app.use(express.json());
// these paths need to be set to use JS and CSS files internally within the Web App as well
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'assets')));

// REST APIs for the App

// GET all products
app.get('/products', (req, res) => {
  db.all('SELECT * FROM products order by id desc', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else {
      res.send(rows);
    }
  });
});


// POST new product
app.post('/products', (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) {
    res.status(400).send('Name and price are required');
  } else {
    const sql = 'INSERT INTO products(name, price) VALUES (?, ?)';
    db.run(sql, [name, price], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error');
      } else {
        const id = this.lastID;
        res.status(201).send({ id, name, price });
      }
    });
  }
});

// PUT update product by ID
app.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  if (!name || !price) {
    res.status(400).send('Name and price are required');
  } else {
    const sql = 'UPDATE products SET name = ?, price = ? WHERE id = ?';
    db.run(sql, [name, price, id], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal server error');
      } else if (this.changes === 0) {
        res.status(404).send('Product not found');
      } else {
        res.status(200).send({ id, name, price });
      }
    });
  }
});

// DELETE product by ID
app.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (this.changes === 0) {
      res.status(404).send('Product not found');
    } else {
      res.status(204).send();
    }
  });
});


// GET / Search for a specific product by ID
app.get('/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('Product not found');
    } else {
      res.send(row);
    }
  });
});

//GET / Search all fields 
app.get('/search/:searchstring', (req, res) => {
  const { searchstring } = req.params;
  const searchTerms = ['%' + searchstring + '%', '%' + searchstring +  '%', '%' + searchstring +  '%'];
  db.all('SELECT * FROM products WHERE id LIKE ? OR name LIKE ? OR price LIKE ?', searchTerms, (err, row) => {
    console.log('Query Issued for ' + searchTerms);
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal server error');
    } else if (!row) {
      res.status(404).send('No Matching Results');
    } else {
      res.send(row);
    }
  });
});

// Handle second module routing here to second.html
app.get('/second', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'second.html'));
});


// Handle all other routes by serving the index.html file (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});