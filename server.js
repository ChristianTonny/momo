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

// Database connection
function getDatabase() {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error connecting to database:', err.message);
        }
    });
}

// API Routes

// Get dashboard statistics
app.get('/api/stats', (req, res) => {
    const db = getDatabase();
    
    const queries = {
        totalTransactions: 'SELECT COUNT(*) as count FROM transactions',
        totalAmount: 'SELECT SUM(amount) as total FROM transactions WHERE amount IS NOT NULL',
        totalFees: 'SELECT SUM(fee) as total FROM transactions WHERE fee > 0',
        transactionTypes: `
            SELECT transaction_type, COUNT(*) as count, SUM(amount) as total_amount 
            FROM transactions 
            WHERE transaction_type != 'OTP_MESSAGE'
            GROUP BY transaction_type 
            ORDER BY count DESC
        `,
        monthlyStats: `
            SELECT 
                strftime('%Y-%m', datetime(date_timestamp/1000, 'unixepoch')) as month,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                SUM(fee) as total_fees
            FROM transactions 
            WHERE transaction_type != 'OTP_MESSAGE'
            GROUP BY month 
            ORDER BY month DESC 
            LIMIT 12
        `,
        recentTransactions: `
            SELECT * FROM transactions 
            WHERE transaction_type != 'OTP_MESSAGE'
            ORDER BY date_timestamp DESC 
            LIMIT 10
        `
    };

    const stats = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        if (key === 'totalTransactions' || key === 'totalAmount' || key === 'totalFees') {
            db.get(query, (err, row) => {
                if (err) {
                    console.error(`Error in ${key}:`, err.message);
                    stats[key] = null;
                } else {
                    stats[key] = row;
                }
                
                completedQueries++;
                if (completedQueries === totalQueries) {
                    db.close();
                    res.json(stats);
                }
            });
        } else {
            db.all(query, (err, rows) => {
                if (err) {
                    console.error(`Error in ${key}:`, err.message);
                    stats[key] = [];
                } else {
                    stats[key] = rows;
                }
                
                completedQueries++;
                if (completedQueries === totalQueries) {
                    db.close();
                    res.json(stats);
                }
            });
        }
    });
});

// Get transactions with filtering and pagination
app.get('/api/transactions', (req, res) => {
    const db = getDatabase();
    const {
        page = 1,
        limit = 50,
        type,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ["transaction_type != 'OTP_MESSAGE'"];
    let params = [];

    // Build WHERE conditions
    if (type && type !== 'all') {
        whereConditions.push('transaction_type = ?');
        params.push(type);
    }

    if (startDate) {
        whereConditions.push('date_timestamp >= ?');
        params.push(new Date(startDate).getTime());
    }

    if (endDate) {
        whereConditions.push('date_timestamp <= ?');
        params.push(new Date(endDate).getTime());
    }

    if (minAmount) {
        whereConditions.push('amount >= ?');
        params.push(parseFloat(minAmount));
    }

    if (maxAmount) {
        whereConditions.push('amount <= ?');
        params.push(parseFloat(maxAmount));
    }

    if (search) {
        whereConditions.push('(recipient_name LIKE ? OR sender_name LIKE ? OR message_body LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM transactions ${whereClause}`;
    
    db.get(countQuery, params, (err, countResult) => {
        if (err) {
            console.error('Error getting transaction count:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }

        // Get transactions
        const dataQuery = `
            SELECT * FROM transactions 
            ${whereClause}
            ORDER BY date_timestamp DESC 
            LIMIT ? OFFSET ?
        `;
        
        db.all(dataQuery, [...params, limit, offset], (err, transactions) => {
            if (err) {
                console.error('Error getting transactions:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }

            db.close();
            res.json({
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// Get transaction types
app.get('/api/transaction-types', (req, res) => {
    const db = getDatabase();
    
    const query = `
        SELECT DISTINCT transaction_type as type_name, COUNT(*) as count
        FROM transactions 
        WHERE transaction_type != 'OTP_MESSAGE'
        GROUP BY transaction_type 
        ORDER BY count DESC
    `;
    
    db.all(query, (err, types) => {
        if (err) {
            console.error('Error getting transaction types:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        db.close();
        res.json(types);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MTN MoMo Analytics Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`🔗 API endpoints available at http://localhost:${PORT}/api/*`);
}); 