const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Database path
const dbPath = path.join(__dirname, 'database/momo_transactions.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
    console.log(` MTN MoMo Analytics Server running on http://localhost:${PORT}`);
    console.log(` Dashboard available at http://localhost:${PORT}`);
    console.log(` API endpoints available at http://localhost:${PORT}/api/*`);
}); 