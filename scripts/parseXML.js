const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const dbPath = path.join(__dirname, '../database/momo_transactions.db');
const xmlPath = path.join(__dirname, '../modified_sms_v2.xml');

class SMSProcessor {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
        this.processedCount = 0;
        this.ignoredCount = 0;
        this.errorCount = 0;
        this.logMessages = [];
    }

    // Log messages for later review
    log(type, message, details = null) {
        const logEntry = {
            type,
            message,
            details: details ? JSON.stringify(details) : null,
            timestamp: new Date().toISOString()
        };
        this.logMessages.push(logEntry);
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Extract amount from text
    extractAmount(text) {
        const amountMatches = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*RWF/g);
        if (amountMatches) {
            return parseFloat(amountMatches[0].replace(/[,\s]/g, '').replace('RWF', ''));
        }
        return null;
    }

    // Extract phone number from text
    extractPhone(text) {
        const phoneMatch = text.match(/\(?(250\d{9}|\*{9}\d{3})\)?/);
        return phoneMatch ? phoneMatch[1] : null;
    }

    // Extract transaction ID
    extractTransactionId(text) {
        const txIdMatch = text.match(/TxId:\s*(\d+)/i) || 
                         text.match(/Transaction Id:\s*(\d+)/i) ||
                         text.match(/Financial Transaction Id:\s*(\d+)/i);
        return txIdMatch ? txIdMatch[1] : null;
    }

    // Categorize transaction based on SMS body
    categorizeTransaction(body) {
        body = body.toLowerCase();
        
        // OTP Messages
        if (body.includes('one-time password') || body.includes('otp')) {
            return 'OTP_MESSAGE';
        }

        // Incoming money
        if (body.includes('you have received') && body.includes('rwf from')) {
            return 'INCOMING_MONEY';
        }

        // Bank deposits
        if (body.includes('bank deposit') && body.includes('has been added')) {
            return 'BANK_DEPOSIT';
        }

        // Agent withdrawals
        if (body.includes('withdrawn') && body.includes('agent')) {
            return 'AGENT_WITHDRAWAL';
        }

        // Mobile transfers
        if (body.includes('transferred to') && body.includes('250')) {
            return 'TRANSFER_TO_MOBILE';
        }

        // Airtime payments
        if (body.includes('airtime') || (body.includes('*162*') && body.includes('airtime'))) {
            return 'AIRTIME_PAYMENT';
        }

        // Cash Power payments
        if (body.includes('cash power') || body.includes('mtn cash power')) {
            return 'CASH_POWER_PAYMENT';
        }

        // Bundle purchases
        if (body.includes('bundles and packs') || body.includes('internet bundle') || 
            body.includes('data bundle') || body.includes('voice bundle')) {
            return 'BUNDLE_PURCHASE';
        }

        // Third party transactions
        if (body.includes('*164*') || body.includes('direct payment')) {
            return 'THIRD_PARTY_TRANSACTION';
        }

        // Code holder payments
        if (body.includes('your payment of') && body.includes('has been completed')) {
            return 'PAYMENT_TO_CODE';
        }

        return 'UNKNOWN';
    }

    // Parse individual SMS transaction
    parseTransaction(smsData) {
        const body = smsData.body;
        const transactionType = this.categorizeTransaction(body);
        
        const transaction = {
            transaction_id: this.extractTransactionId(body),
            transaction_type: transactionType,
            amount: null,
            fee: 0,
            recipient_name: null,
            recipient_phone: null,
            sender_name: null,
            sender_phone: null,
            balance_after: null,
            balance_before: null,
            date_timestamp: parseInt(smsData.date),
            date_readable: smsData.readable_date,
            message_body: body,
            agent_name: null,
            agent_phone: null,
            external_transaction_id: null,
            financial_transaction_id: null,
            token: null
        };

        // Extract amounts based on transaction type
        const amounts = body.match(/(\d{1,3}(?:,\d{3})*)\s*RWF/g);
        
        if (amounts) {
            amounts.forEach(amountStr => {
                const amount = parseFloat(amountStr.replace(/[,\s]/g, '').replace('RWF', ''));
                
                if (body.toLowerCase().includes('balance') && 
                    (body.toLowerCase().indexOf('balance') < body.toLowerCase().indexOf(amountStr))) {
                    transaction.balance_after = amount;
                } else if (!transaction.amount || amount > transaction.amount) {
                    transaction.amount = amount;
                }
            });
        }

        // Extract fee
        const feeMatch = body.match(/fee\s*(?:was|is)?:?\s*(\d+(?:,\d{3})*)\s*RWF/i);
        if (feeMatch) {
            transaction.fee = parseFloat(feeMatch[1].replace(/,/g, ''));
        }

        // Extract recipient information
        const recipientMatch = body.match(/(?:to|transferred to)\s*([^(]+)\s*\(?(250\d{9})\)?/i);
        if (recipientMatch) {
            transaction.recipient_name = recipientMatch[1].trim();
            transaction.recipient_phone = recipientMatch[2];
        }

        // Extract sender information for incoming money
        if (transactionType === 'INCOMING_MONEY') {
            const senderMatch = body.match(/from\s*([^(]+)\s*\(\*{9}\d{3}\)/i);
            if (senderMatch) {
                transaction.sender_name = senderMatch[1].trim();
            }
        }

        // Extract agent information
        if (transactionType === 'AGENT_WITHDRAWAL') {
            const agentMatch = body.match(/agent:\s*([^(]+)\s*\(?(250\d{9})\)?/i);
            if (agentMatch) {
                transaction.agent_name = agentMatch[1].trim();
                transaction.agent_phone = agentMatch[2];
            }
        }

        // Extract financial transaction ID
        const finTxIdMatch = body.match(/Financial Transaction Id:\s*(\d+)/i);
        if (finTxIdMatch) {
            transaction.financial_transaction_id = finTxIdMatch[1];
        }

        // Extract external transaction ID
        const extTxIdMatch = body.match(/External Transaction Id:\s*([a-zA-Z0-9-]+)/i);
        if (extTxIdMatch) {
            transaction.external_transaction_id = extTxIdMatch[1];
        }

        // Extract token for cash power
        const tokenMatch = body.match(/token\s*([0-9-]+)/i);
        if (tokenMatch) {
            transaction.token = tokenMatch[1];
        }

        return transaction;
    }

    // Insert transaction into database
    insertTransaction(transaction) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO transactions (
                    transaction_id, transaction_type, amount, fee, recipient_name, recipient_phone,
                    sender_name, sender_phone, balance_after, balance_before, date_timestamp,
                    date_readable, message_body, agent_name, agent_phone, external_transaction_id,
                    financial_transaction_id, token
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                transaction.transaction_id,
                transaction.transaction_type,
                transaction.amount,
                transaction.fee,
                transaction.recipient_name,
                transaction.recipient_phone,
                transaction.sender_name,
                transaction.sender_phone,
                transaction.balance_after,
                transaction.balance_before,
                transaction.date_timestamp,
                transaction.date_readable,
                transaction.message_body,
                transaction.agent_name,
                transaction.agent_phone,
                transaction.external_transaction_id,
                transaction.financial_transaction_id,
                transaction.token
            ], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Insert raw SMS data
    insertRawSMS(smsData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO raw_sms (
                    protocol, address, date_timestamp, type, subject, body, 
                    readable_date, contact_name, processed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                smsData.protocol,
                smsData.address,
                parseInt(smsData.date),
                smsData.type,
                smsData.subject,
                smsData.body,
                smsData.readable_date,
                smsData.contact_name,
                true
            ], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Save processing logs to database
    saveProcessingLogs() {
        return new Promise((resolve) => {
            const sql = `INSERT INTO processing_log (message, type, details) VALUES (?, ?, ?)`;
            let completed = 0;
            
            if (this.logMessages.length === 0) {
                resolve();
                return;
            }

            this.logMessages.forEach(log => {
                this.db.run(sql, [log.message, log.type, log.details], () => {
                    completed++;
                    if (completed === this.logMessages.length) {
                        resolve();
                    }
                });
            });
        });
    }

    // Process all SMS data
    async processSMSData() {
        try {
            // Read and parse XML file
            const xmlData = fs.readFileSync(xmlPath, 'utf8');
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(xmlData);

            const smsArray = result.smses.sms;
            this.log('INFO', `Found ${smsArray.length} SMS messages to process`);

            // Process each SMS
            for (let i = 0; i < smsArray.length; i++) {
                const smsData = smsArray[i].$;
                
                try {
                    // Insert raw SMS data
                    await this.insertRawSMS(smsData);

                    // Skip if not from M-Money
                    if (smsData.address !== 'M-Money') {
                        this.ignoredCount++;
                        this.log('SKIP', `Skipping non-MoMo SMS from ${smsData.address}`);
                        continue;
                    }

                    // Parse and insert transaction
                    const transaction = this.parseTransaction(smsData);
                    await this.insertTransaction(transaction);
                    this.processedCount++;

                    if (this.processedCount % 100 === 0) {
                        this.log('PROGRESS', `Processed ${this.processedCount} transactions`);
                    }

                } catch (error) {
                    this.errorCount++;
                    this.log('ERROR', `Error processing SMS ${i + 1}`, error.message);
                }
            }

            // Save processing logs
            await this.saveProcessingLogs();

            // Final summary
            this.log('SUCCESS', `Processing completed: ${this.processedCount} processed, ${this.ignoredCount} ignored, ${this.errorCount} errors`);

        } catch (error) {
            this.log('FATAL', 'Failed to process XML file', error.message);
            throw error;
        }
    }

    // Close database connection
    close() {
        this.db.close();
    }
}

// Main execution
async function main() {
    const processor = new SMSProcessor();
    
    try {
        await processor.processSMSData();
        console.log('\n✓ SMS data processing completed successfully!');
    } catch (error) {
        console.error('\n✗ SMS data processing failed:', error.message);
        process.exit(1);
    } finally {
        processor.close();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = SMSProcessor; 