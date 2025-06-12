const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../database/momo_transactions.db');

// Create database and tables
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

// Create transactions table
const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT,
        transaction_type TEXT NOT NULL,
        amount REAL,
        fee REAL DEFAULT 0,
        recipient_name TEXT,
        recipient_phone TEXT,
        sender_name TEXT,
        sender_phone TEXT,
        balance_after REAL,
        balance_before REAL,
        date_timestamp INTEGER,
        date_readable TEXT,
        message_body TEXT,
        agent_name TEXT,
        agent_phone TEXT,
        external_transaction_id TEXT,
        financial_transaction_id TEXT,
        token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`;

// Create transaction_types table for categorization
const createTransactionTypesTable = `
    CREATE TABLE IF NOT EXISTS transaction_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type_name TEXT UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`;

// Create raw_sms table for storing original SMS data
const createRawSmsTable = `
    CREATE TABLE IF NOT EXISTS raw_sms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        protocol TEXT,
        address TEXT,
        date_timestamp INTEGER,
        type TEXT,
        subject TEXT,
        body TEXT,
        readable_date TEXT,
        contact_name TEXT,
        processed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`;

// Create processing_log table for logging
const createProcessingLogTable = `
    CREATE TABLE IF NOT EXISTS processing_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT,
        type TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`;

// Insert default transaction types
const insertTransactionTypes = `
    INSERT OR IGNORE INTO transaction_types (type_name, description) VALUES
    ('INCOMING_MONEY', 'Money received from other users'),
    ('PAYMENT_TO_CODE', 'Payments to merchants/code holders'),
    ('TRANSFER_TO_MOBILE', 'Transfers to mobile numbers'),
    ('BANK_DEPOSIT', 'Bank deposits to mobile money account'),
    ('BANK_WITHDRAWAL', 'Withdrawals from mobile money to bank'),
    ('AIRTIME_PAYMENT', 'Airtime bill payments'),
    ('CASH_POWER_PAYMENT', 'Cash Power/electricity bill payments'),
    ('THIRD_PARTY_TRANSACTION', 'Transactions initiated by third parties'),
    ('AGENT_WITHDRAWAL', 'Cash withdrawals from agents'),
    ('BUNDLE_PURCHASE', 'Internet and voice bundle purchases'),
    ('OTP_MESSAGE', 'One-time password messages'),
    ('UNKNOWN', 'Unknown or unclassified transactions')
`;

// Create tables
db.serialize(() => {
    db.run(createTransactionsTable, (err) => {
        if (err) {
            console.error('Error creating transactions table:', err.message);
        } else {
            console.log('✓ Transactions table created successfully');
        }
    });

    db.run(createTransactionTypesTable, (err) => {
        if (err) {
            console.error('Error creating transaction_types table:', err.message);
        } else {
            console.log('✓ Transaction types table created successfully');
        }
    });

    db.run(createRawSmsTable, (err) => {
        if (err) {
            console.error('Error creating raw_sms table:', err.message);
        } else {
            console.log('✓ Raw SMS table created successfully');
        }
    });

    db.run(createProcessingLogTable, (err) => {
        if (err) {
            console.error('Error creating processing_log table:', err.message);
        } else {
            console.log('✓ Processing log table created successfully');
        }
    });

    db.run(insertTransactionTypes, (err) => {
        if (err) {
            console.error('Error inserting transaction types:', err.message);
        } else {
            console.log('✓ Default transaction types inserted successfully');
        }
    });
});

// Close database connection
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('✓ Database setup completed successfully!');
    }
}); 