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
        this.transactionTypes = {
            OTP_MESSAGE: 'One-Time Password Message',
            INCOMING_MONEY: 'Incoming Money Transfer',
            BANK_DEPOSIT: 'Bank Deposit',
            AGENT_WITHDRAWAL: 'Agent Withdrawal',
            TRANSFER_TO_MOBILE: 'Mobile Money Transfer',
            AIRTIME_PAYMENT: 'Airtime Purchase',
            CASH_POWER_PAYMENT: 'Cash Power Payment',
            BUNDLE_PURCHASE: 'Data/Voice Bundle Purchase',
            THIRD_PARTY_TRANSACTION: 'Third Party Payment',
            PAYMENT_TO_CODE: 'Payment to Code Holder',
            UNKNOWN: 'Unknown Transaction Type'
        };
    }

    // Enhanced logging with severity levels
    log(type, message, details = null, severity = 'INFO') {
        const logEntry = {
            type,
            message,
            details: details ? JSON.stringify(details) : null,
            timestamp: new Date().toISOString(),
            severity
        };
        this.logMessages.push(logEntry);
        console.log(`[${severity}] [${type.toUpperCase()}] ${message}`);
    }

    // Validate phone number format
    validatePhoneNumber(phone) {
        if (!phone) return false;
        return /^250\d{9}$/.test(phone.replace(/\D/g, ''));
    }

    // Validate amount format
    validateAmount(amount) {
        if (amount === null || amount === undefined) return false;
        return !isNaN(amount) && amount >= 0;
    }

    // Clean and normalize text
    normalizeText(text) {
        if (!text) return '';
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s-]/g, '');
    }

    // Enhanced amount extraction with validation
    extractAmount(text) {
        try {
            const amountMatches = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*RWF/g);
            if (amountMatches) {
                const amount = parseFloat(amountMatches[0].replace(/[,\s]/g, '').replace('RWF', ''));
                return this.validateAmount(amount) ? amount : null;
            }
            return null;
        } catch (error) {
            this.log('AMOUNT_EXTRACTION', 'Error extracting amount', { text, error }, 'ERROR');
            return null;
        }
    }

    // Enhanced phone number extraction with validation
    extractPhone(text) {
        try {
            const phoneMatch = text.match(/\(?(250\d{9}|\*{9}\d{3})\)?/);
            const phone = phoneMatch ? phoneMatch[1] : null;
            return this.validatePhoneNumber(phone) ? phone : null;
        } catch (error) {
            this.log('PHONE_EXTRACTION', 'Error extracting phone number', { text, error }, 'ERROR');
            return null;
        }
    }

    // Enhanced transaction ID extraction
    extractTransactionId(text) {
        try {
            const txIdMatch = text.match(/TxId:\s*(\d+)/i) || 
                             text.match(/Transaction Id:\s*(\d+)/i) ||
                             text.match(/Financial Transaction Id:\s*(\d+)/i);
            return txIdMatch ? txIdMatch[1] : null;
        } catch (error) {
            this.log('TXID_EXTRACTION', 'Error extracting transaction ID', { text, error }, 'ERROR');
            return null;
        }
    }

    // Enhanced transaction categorization with detailed logging
    categorizeTransaction(body) {
        try {
            body = body.toLowerCase();
            
            // Log the categorization attempt
            this.log('CATEGORIZATION', 'Attempting to categorize transaction', { body }, 'DEBUG');

            // Enhanced categorization logic with more specific patterns
            if (body.includes('one-time password') || body.includes('otp')) {
                return 'OTP_MESSAGE';
            }

            if (body.includes('you have received') && body.includes('rwf from')) {
                return 'INCOMING_MONEY';
            }

            if (body.includes('bank deposit') && body.includes('has been added')) {
                return 'BANK_DEPOSIT';
            }

            if (body.includes('withdrawn') && body.includes('agent')) {
                return 'AGENT_WITHDRAWAL';
            }

            if (body.includes('transferred to') && body.includes('250')) {
                return 'TRANSFER_TO_MOBILE';
            }

            if (body.includes('airtime') || (body.includes('*162*') && body.includes('airtime'))) {
                return 'AIRTIME_PAYMENT';
            }

            if (body.includes('cash power') || body.includes('mtn cash power')) {
                return 'CASH_POWER_PAYMENT';
            }

            if (body.includes('bundles and packs') || body.includes('internet bundle') || 
                body.includes('data bundle') || body.includes('voice bundle')) {
                return 'BUNDLE_PURCHASE';
            }

            if (body.includes('*164*') || body.includes('direct payment')) {
                return 'THIRD_PARTY_TRANSACTION';
            }

            if (body.includes('your payment of') && body.includes('has been completed')) {
                return 'PAYMENT_TO_CODE';
            }

            this.log('CATEGORIZATION', 'Transaction type not recognized', { body }, 'WARNING');
            return 'UNKNOWN';
        } catch (error) {
            this.log('CATEGORIZATION', 'Error categorizing transaction', { body, error }, 'ERROR');
            return 'UNKNOWN';
        }
    }

    // Enhanced transaction parsing with validation
    parseTransaction(smsData) {
        try {
            if (!smsData || !smsData.body) {
                this.log('PARSING', 'Invalid SMS data received', { smsData }, 'ERROR');
                return null;
            }

            const body = this.normalizeText(smsData.body);
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
                date_timestamp: parseInt(smsData.date) || Date.now(),
                date_readable: smsData.readable_date || new Date().toISOString(),
                message_body: body,
                agent_name: null,
                agent_phone: null,
                external_transaction_id: null,
                financial_transaction_id: null,
                token: null
            };

            // Extract and validate amounts
            const amounts = body.match(/(\d{1,3}(?:,\d{3})*)\s*RWF/g);
            if (amounts) {
                amounts.forEach(amountStr => {
                    const amount = parseFloat(amountStr.replace(/[,\s]/g, '').replace('RWF', ''));
                    if (this.validateAmount(amount)) {
                        if (body.toLowerCase().includes('balance') && 
                            (body.toLowerCase().indexOf('balance') < body.toLowerCase().indexOf(amountStr))) {
                            transaction.balance_after = amount;
                        } else if (!transaction.amount || amount > transaction.amount) {
                            transaction.amount = amount;
                        }
                    }
                });
            }

            // Extract and validate fee
            const feeMatch = body.match(/fee\s*(?:was|is)?:?\s*(\d+(?:,\d{3})*)\s*RWF/i);
            if (feeMatch) {
                const fee = parseFloat(feeMatch[1].replace(/,/g, ''));
                if (this.validateAmount(fee)) {
                    transaction.fee = fee;
                }
            }

            // Extract and validate recipient information
            const recipientMatch = body.match(/(?:to|transferred to)\s*([^(]+)\s*\(?(250\d{9})\)?/i);
            if (recipientMatch) {
                transaction.recipient_name = this.normalizeText(recipientMatch[1]);
                const phone = recipientMatch[2];
                if (this.validatePhoneNumber(phone)) {
                    transaction.recipient_phone = phone;
                }
            }

            // Extract and validate sender information for incoming money
            if (transactionType === 'INCOMING_MONEY') {
                const senderMatch = body.match(/from\s*([^(]+)\s*\(\*{9}\d{3}\)/i);
                if (senderMatch) {
                    transaction.sender_name = this.normalizeText(senderMatch[1]);
                }
            }

            // Extract and validate agent information
            if (transactionType === 'AGENT_WITHDRAWAL') {
                const agentMatch = body.match(/agent:\s*([^(]+)\s*\(?(250\d{9})\)?/i);
                if (agentMatch) {
                    transaction.agent_name = this.normalizeText(agentMatch[1]);
                    const phone = agentMatch[2];
                    if (this.validatePhoneNumber(phone)) {
                        transaction.agent_phone = phone;
                    }
                }
            }

            // Extract and validate transaction IDs
            const finTxIdMatch = body.match(/Financial Transaction Id:\s*(\d+)/i);
            if (finTxIdMatch) {
                transaction.financial_transaction_id = finTxIdMatch[1];
            }

            const extTxIdMatch = body.match(/External Transaction Id:\s*([a-zA-Z0-9-]+)/i);
            if (extTxIdMatch) {
                transaction.external_transaction_id = extTxIdMatch[1];
            }

            // Extract token for cash power
            const tokenMatch = body.match(/token\s*([0-9-]+)/i);
            if (tokenMatch) {
                transaction.token = tokenMatch[1];
            }

            // Validate required fields
            if (!transaction.transaction_id || !transaction.transaction_type) {
                this.log('PARSING', 'Missing required transaction fields', { transaction }, 'WARNING');
            }

            return transaction;
        } catch (error) {
            this.log('PARSING', 'Error parsing transaction', { smsData, error }, 'ERROR');
            return null;
        }
    }

    // Enhanced database operations with transaction support
    async insertTransaction(transaction) {
        return new Promise((resolve, reject) => {
            if (!transaction) {
                reject(new Error('Invalid transaction data'));
                return;
            }

            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');

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
                        this.db.run('ROLLBACK');
                        this.log('DB_INSERT', 'Error inserting transaction', { transaction, error: err }, 'ERROR');
                        reject(err);
                    } else {
                        this.db.run('COMMIT');
                        this.processedCount++;
                        resolve();
                    }
                });
            });
        });
    }

    // Enhanced raw SMS insertion
    async insertRawSMS(smsData) {
        return new Promise((resolve, reject) => {
            if (!smsData) {
                reject(new Error('Invalid SMS data'));
                return;
            }

            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');

                const sql = `
                    INSERT INTO raw_sms (
                        date, readable_date, body, type, address
                    ) VALUES (?, ?, ?, ?, ?)
                `;

                this.db.run(sql, [
                    smsData.date,
                    smsData.readable_date,
                    smsData.body,
                    smsData.type,
                    smsData.address
                ], (err) => {
                    if (err) {
                        this.db.run('ROLLBACK');
                        this.log('DB_INSERT', 'Error inserting raw SMS', { smsData, error: err }, 'ERROR');
                        reject(err);
                    } else {
                        this.db.run('COMMIT');
                        resolve();
                    }
                });
            });
        });
    }

    // Save processing logs to file
    async saveProcessingLogs() {
        try {
            const logPath = path.join(__dirname, '../logs/processing_logs.json');
            const logDir = path.dirname(logPath);

            // Create logs directory if it doesn't exist
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const logData = {
                timestamp: new Date().toISOString(),
                processedCount: this.processedCount,
                ignoredCount: this.ignoredCount,
                errorCount: this.errorCount,
                logs: this.logMessages
            };

            await fs.promises.writeFile(logPath, JSON.stringify(logData, null, 2));
            this.log('LOGGING', 'Processing logs saved successfully', { logPath }, 'INFO');
        } catch (error) {
            console.error('Error saving processing logs:', error);
        }
    }

    // Enhanced main processing function
    async processSMSData() {
        try {
            this.log('PROCESSING', 'Starting SMS data processing', null, 'INFO');

            // Read and parse XML file
            const xmlData = await fs.promises.readFile(xmlPath, 'utf8');
            const parser = new xml2js.Parser({
                explicitArray: false,
                mergeAttrs: true
            });

            const result = await parser.parseStringPromise(xmlData);
            const smsList = result.smses.sms;

            if (!Array.isArray(smsList)) {
                throw new Error('Invalid SMS data format');
            }

            this.log('PROCESSING', `Found ${smsList.length} SMS messages to process`, null, 'INFO');

            // Process SMS messages in batches
            const batchSize = 100;
            for (let i = 0; i < smsList.length; i += batchSize) {
                const batch = smsList.slice(i, i + batchSize);
                this.log('PROCESSING', `Processing batch ${i / batchSize + 1}`, { 
                    start: i, 
                    end: Math.min(i + batchSize, smsList.length) 
                }, 'INFO');

                // Process each SMS in the batch
                for (const smsData of batch) {
                    try {
                        // Save raw SMS data
                        await this.insertRawSMS(smsData);

                        // Parse and save transaction
                        const transaction = this.parseTransaction(smsData);
                        if (transaction) {
                            await this.insertTransaction(transaction);
                        } else {
                            this.ignoredCount++;
                            this.log('PROCESSING', 'Skipped invalid transaction', { smsData }, 'WARNING');
                        }
                    } catch (error) {
                        this.errorCount++;
                        this.log('PROCESSING', 'Error processing SMS', { smsData, error }, 'ERROR');
                        // Continue processing other SMS messages
                        continue;
                    }
                }

                // Save progress after each batch
                await this.saveProcessingLogs();
            }

            // Final processing summary
            this.log('PROCESSING', 'SMS data processing completed', {
                total: smsList.length,
                processed: this.processedCount,
                ignored: this.ignoredCount,
                errors: this.errorCount
            }, 'INFO');

            // Save final logs
            await this.saveProcessingLogs();

        } catch (error) {
            this.log('PROCESSING', 'Fatal error during SMS processing', { error }, 'ERROR');
            throw error;
        }
    }

    // Close database connection
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

// Main execution
async function main() {
    const processor = new SMSProcessor();
    try {
        await processor.processSMSData();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        await processor.close();
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SMSProcessor; 