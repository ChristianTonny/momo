const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/momo_transactions.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database.', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT UNIQUE,
    transaction_type TEXT NOT NULL,
    amount REAL,
    fee REAL DEFAULT 0,
    recipient_name TEXT,
    sender_name TEXT,
    recipient_phone TEXT,
    sender_phone TEXT,
    date_timestamp INTEGER,
    balance_after REAL,
    message_body TEXT,
    agent_name TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.serialize(() => {
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating transactions table.', err.message);
            return;
        }
        console.log('✓ Transactions table created or already exists.');
    });

    // You can add more table creation queries or index creations here

    // Example of adding an index for faster queries
    const createIndexQuery = `CREATE INDEX IF NOT EXISTS idx_transaction_type ON transactions (transaction_type);`;
    db.run(createIndexQuery, (err) => {
        if (err) {
            console.error('Error creating index on transaction_type.', err.message);
            return;
        }
        console.log('✓ Index on transaction_type created or already exists.');
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing the database connection.', err.message);
    } else {
        console.log('✓ Database setup completed successfully!');
    }
}); 