/**
 * Copyright (c) 2025, Kirahi LLC
 * Max Seenisamy kirahi.com
 * 
 * Express.js server for Item Management System
 */

import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 9785;

const db = new sqlite3.Database('./products.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the Demo App Database - products.db SQLite Db File');
});

app.use(express.json());
// these paths need to be set to use JS and CSS files internally within the Web App as well
// the order of the paths is important, the first path is the one that will be used if the file is not found in the other paths
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'css')));

// REST APIs for the App
// Start of Dynamic CRUD API - added by Cursor

// Utility: metadata cache and helpers for dynamic table CRUD
const metadataCache = new Map(); // tableName -> { columns: string[], primaryKey: string|null }

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function getTableMetadata(tableName, callback) {
  if (!tableName) return callback(new Error('Table name is required'));
  if (metadataCache.has(tableName)) return callback(null, metadataCache.get(tableName));

  // Verify table exists
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [tableName],
    (err, row) => {
      if (err) return callback(err);
      if (!row) return callback(new Error(`Table not found: ${tableName}`));

      // Introspect columns and primary key
      const pragmaSql = `PRAGMA table_info(${quoteIdentifier(tableName)})`;
      db.all(pragmaSql, [], (pragmaErr, rows) => {
        if (pragmaErr) return callback(pragmaErr);
        if (!rows || rows.length === 0) return callback(new Error(`No columns found for ${tableName}`));
        const columns = rows.map((r) => r.name);
        const pkRow = rows.find((r) => r.pk === 1) || rows.find((r) => r.pk > 0);
        const primaryKey = pkRow ? pkRow.name : (columns.includes('id') ? 'id' : null);
        const meta = { columns, primaryKey };
        metadataCache.set(tableName, meta);
        callback(null, meta);
      });
    }
  );
}

// Metadata endpoint for client consumption
app.get('/api/:table/meta', (req, res) => {
  const { table } = req.params;
  getTableMetadata(table, (err, meta) => {
    if (err) return res.status(400).send(err.message);
    res.send(meta);
  });
});

// Generic dynamic CRUD API
// List rows
app.get('/api/:table', (req, res) => {
  const { table } = req.params;
  getTableMetadata(table, (err, meta) => {
    if (err) return res.status(400).send(err.message);
    const orderBy = meta.primaryKey ? ` ORDER BY ${quoteIdentifier(meta.primaryKey)} DESC` : '';
    const sql = `SELECT * FROM ${quoteIdentifier(table)}${orderBy}`;
    db.all(sql, [], (qErr, rows) => {
      if (qErr) return res.status(500).send('Internal server error');
      res.send(rows || []);
    });
  });
});

// Get one by primary key
app.get('/api/:table/:id', (req, res) => {
  const { table, id } = req.params;
  getTableMetadata(table, (err, meta) => {
    if (err) return res.status(400).send(err.message);
    if (!meta.primaryKey) return res.status(400).send('Primary key not found for this table');
    const sql = `SELECT * FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(meta.primaryKey)} = ?`;
    db.get(sql, [id], (qErr, row) => {
      if (qErr) return res.status(500).send('Internal server error');
      if (!row) return res.status(404).send('Item not found');
      res.send(row);
    });
  });
});

// Create
app.post('/api/:table', (req, res) => {
  const { table } = req.params;
  getTableMetadata(table, (err, meta) => {
    if (err) return res.status(400).send(err.message);
    const insertable = meta.columns.filter((c) => c !== meta.primaryKey);
    const keys = insertable.filter((c) => Object.prototype.hasOwnProperty.call(req.body, c));
    if (keys.length === 0) return res.status(400).send('No valid columns provided in request body');
    
    // Auto-populate timestamp fields for new records
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    const datetimeStr = now.toISOString(); // Full ISO datetime
    
    const autoFields = {};
    if (meta.columns.includes('createdon') && !keys.includes('createdon')) {
      autoFields.createdon = dateStr;
    }
    if (meta.columns.includes('modifiedon') && !keys.includes('modifiedon')) {
      autoFields.modifiedon = dateStr;
    }
    if (meta.columns.includes('modifiedtime') && !keys.includes('modifiedtime')) {
      autoFields.modifiedtime = timeStr;
    }
    
    // Add auto fields to keys and values
    const allKeys = [...keys, ...Object.keys(autoFields)];
    const allValues = [...keys.map((k) => req.body[k]), ...Object.values(autoFields)];
    
    const columnClause = allKeys.map(quoteIdentifier).join(', ');
    const placeholders = allKeys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${quoteIdentifier(table)} (${columnClause}) VALUES (${placeholders})`;
    db.run(sql, allValues, function(runErr) {
      if (runErr) {
        console.error('Database error:', runErr);
        console.error('SQL:', sql);
        console.error('Values:', allValues);
        return res.status(500).send(`Internal server error: ${runErr.message}`);
      }
      const response = Object.fromEntries(allKeys.map((k, i) => [k, allValues[i]]));
      if (meta.primaryKey) response[meta.primaryKey] = this.lastID;
      res.status(201).send(response);
    });
  });
});

// Update
app.put('/api/:table/:id', (req, res) => {
  const { table, id } = req.params;
  getTableMetadata(table, (err, meta) => {
    if (err) return res.status(400).send(err.message);
    if (!meta.primaryKey) return res.status(400).send('Primary key not found for this table');
    const updatable = meta.columns.filter((c) => c !== meta.primaryKey);
    const keys = updatable.filter((c) => Object.prototype.hasOwnProperty.call(req.body, c));
    if (keys.length === 0) return res.status(400).send('No updatable columns provided in request body');
    
    // Auto-update modified timestamp fields
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    
    const autoFields = {};
    if (meta.columns.includes('modifiedon') && !keys.includes('modifiedon')) {
      autoFields.modifiedon = dateStr;
    }
    if (meta.columns.includes('modifiedtime') && !keys.includes('modifiedtime')) {
      autoFields.modifiedtime = timeStr;
    }
    
    // Add auto fields to keys and values
    const allKeys = [...keys, ...Object.keys(autoFields)];
    const allValues = [...keys.map((k) => req.body[k]), ...Object.values(autoFields)];
    
    const setClause = allKeys.map((c) => `${quoteIdentifier(c)} = ?`).join(', ');
    const sql = `UPDATE ${quoteIdentifier(table)} SET ${setClause} WHERE ${quoteIdentifier(meta.primaryKey)} = ?`;
    db.run(sql, [...allValues, id], function(runErr) {
      if (runErr) {
        console.error('Database error:', runErr);
        console.error('SQL:', sql);
        console.error('Values:', [...allValues, id]);
        return res.status(500).send(`Internal server error: ${runErr.message}`);
      }
      if (this.changes === 0) return res.status(404).send('Item not found');
      const response = Object.fromEntries(allKeys.map((k, i) => [k, allValues[i]]));
      response[meta.primaryKey] = id;
      res.status(200).send(response);
    });
  });
});

// Delete
app.delete('/api/:table/:id', (req, res) => {
  const { table, id } = req.params;
  getTableMetadata(table, (err, meta) => {
    if (err) return res.status(400).send(err.message);
    if (!meta.primaryKey) return res.status(400).send('Primary key not found for this table');
    const sql = `DELETE FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(meta.primaryKey)} = ?`;
    db.run(sql, [id], function(runErr) {
      if (runErr) return res.status(500).send('Internal server error');
      if (this.changes === 0) return res.status(404).send('Item not found');
      res.status(204).send();
    });
  });
});

// Search across all columns
app.get('/api/:table/search/:q', (req, res) => {
  const { table, q } = req.params;
  getTableMetadata(table, (err, meta) => {
    if (err) return res.status(400).send(err.message);
    const like = `%${q}%`;
    const where = meta.columns.map((c) => `CAST(${quoteIdentifier(c)} AS TEXT) LIKE ?`).join(' OR ');
    const sql = `SELECT * FROM ${quoteIdentifier(table)} WHERE ${where}`;
    const params = meta.columns.map(() => like);
    db.all(sql, params, (qErr, rows) => {
      if (qErr) return res.status(500).send('Internal server error');
      res.send(rows || []);
    });
  });
});

//End of Dynamic CRUD API - added by Cursor

// Handle .mjs files with proper MIME type
app.get('*.mjs', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, req.path));
});

// Handle all other routes by serving the index.html file (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});