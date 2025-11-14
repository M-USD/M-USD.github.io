// Blockchain and Wallet Simulation - WITH COMPLIANCE INTEGRATION
class PhoneBlockchain {
    constructor() {
        this.users = new Map();
        this.transactions = [];
        this.pendingTransactions = [];
        this.blockHeight = 0;
        this.loadFromStorage();
        this.ensureFeeCollectorExists();
    }

    // Ensure fee collector account exists
    ensureFeeCollectorExists() {
        const feeCollector = security.getFeeCollector();
        if (!this.users.has(feeCollector)) {
            const systemPassword = "system_fee_collector_2024";
            const walletAddress = security.generateWalletAddress(feeCollector);
            const passwordHash = security.hashPassword(systemPassword);
            
            const feeUser = {
                phoneNumber: feeCollector,
                walletAddress: walletAddress,
                passwordHash: passwordHash,
                balance: 0,
                createdAt: new Date().toISOString(),
                isActive: true,
                isSystem: true
            };
            
            this.users.set(feeCollector, feeUser);
            this.saveToStorage();
        }
    }

    // Register new user with phone number
    registerUser(phoneNumber, password) {
        if (!phoneNumber || !password) {
            throw new Error('📵Phone number and password are required');
        }

        if (this.users.has(phoneNumber)) {
            throw new Error('❌Phone number already registered');
        }

        const walletAddress = security.generateWalletAddress(phoneNumber);
        const passwordHash = security.hashPassword(password);
        
        const user = {
            phoneNumber,
            walletAddress,
            passwordHash,
            balance: 0,
            createdAt: new Date().toISOString(),
            isActive: true,
            frozen: false,
            freezeReason: '',
            suspendReason: '',
            transactions: []
        };
        
        this.users.set(phoneNumber, user);
        this.saveToStorage();
        
        return user;
    }

    // Authenticate user
    authenticateUser(phoneNumber, password) {
        console.log('Authenticating:', phoneNumber);
        
        if (!phoneNumber || !password) {
            throw new Error('📵Phone number and password are required');
        }

        const user = this.users.get(phoneNumber);
        if (!user) {
            throw new Error('❌User not found. Please register first.');
        }

        // Check if account is suspended
        if (!user.isActive) {
            throw new Error(`☢️Account suspended. Reason: ${user.suspendReason || 'Violation of terms of service'}`);
        }

        const isValid = security.verifyPassword(password, user.passwordHash);
        console.log('✅Password valid:', isValid);
        
        if (!isValid) {
            throw new Error('❌Invalid password');
        }

        // Ensure balance is a number
        user.balance = parseFloat(user.balance) || 0;
        
        return user;
    }

    // Get user balance
    getBalance(phoneNumber) {
        const user = this.users.get(phoneNumber);
        if (!user) return 0;
        return parseFloat(user.balance) || 0;
    }

    // Send money to another phone number - WITH COMPLIANCE CHECK
    sendMoney(fromPhone, toPhone, amount, password) {
        console.log('Sending money:', { fromPhone, toPhone, amount });
        
        if (!fromPhone || !toPhone || !amount || !password) {
            throw new Error('☢️All fields are required');
        }

        if (amount <= 0) {
            throw new Error('☢️Amount must be positive');
        }

        const fromUser = this.users.get(fromPhone);
        const toUser = this.users.get(toPhone);

        if (!fromUser) {
            throw new Error('☢️Sender account not found');
        }

        if (!toUser) {
            throw new Error('☢️Recipient account not found');
        }

        // Check if sender account is frozen
        if (fromUser.frozen) {
            throw new Error(`☢️Account frozen. Reason: ${fromUser.freezeReason || 'Security concerns'}. Contact support.`);
        }

        // Check if sender account is suspended
        if (!fromUser.isActive) {
            throw new Error(`☢️Account suspended. Reason: ${user.suspendReason || 'Violation of terms of service'}`);
        }

        // Check if recipient account is suspended
        if (!toUser.isActive) {
            throw new Error('☢️Recipient account is suspended');
        }

        if (fromPhone === toPhone) {
            throw new Error('☢️Cannot send to yourself');
        }

        // Verify sender's password
        if (!security.verifyPassword(password, fromUser.passwordHash)) {
            throw new Error('☢️Invalid transaction password');
        }

        // COMPLIANCE CHECK - Integrate regulatory compliance
        if (typeof compliance !== 'undefined') {
            const complianceCheck = compliance.monitorTransaction({
                from: fromPhone,
                to: toPhone,
                amount: amount,
                timestamp: new Date().toISOString(),
                id: 'TX_' + Date.now()
            });
            
            if (!complianceCheck) {
                throw new Error('☢️Transaction blocked by compliance rules');
            }
        }





        // Calculate transaction fee
        const transactionFee = security.calculateTransactionFee(amount);
        const totalDeduction = amount + transactionFee;
        
        console.log('Transaction details:', { amount, fee: transactionFee, total: totalDeduction });

        // Check balance
        const currentBalance = parseFloat(fromUser.balance) || 0;
        if (currentBalance < totalDeduction) {
            throw new Error(`You have insufficient balance. You Need ${totalDeduction.toFixed(2)} USD (including ${transactionFee.toFixed(2)} USD fee)`);
        }

        // Process transaction
        return this.processTransactionWithFee(fromPhone, toPhone, amount, transactionFee);
    }

    // Process transaction with fee
    processTransactionWithFee(fromPhone, toPhone, amount, fee) {
        const fromUser = this.users.get(fromPhone);
        const toUser = this.users.get(toPhone);
        const feeCollector = this.users.get(security.getFeeCollector());

        console.log('Before transaction - From balance:', fromUser.balance, 'To balance:', toUser.balance);

        // Update balances
        fromUser.balance = (parseFloat(fromUser.balance) || 0) - amount - fee;
        toUser.balance = (parseFloat(toUser.balance) || 0) + amount;
        
        if (feeCollector) {
            feeCollector.balance = (parseFloat(feeCollector.balance) || 0) + fee;
        }

        console.log('After transaction - From balance:', fromUser.balance, 'To balance:', toUser.balance);

        // Create main transaction
        const mainTransaction = {
            id: security.generateTransactionId(),
            from: fromPhone,
            to: toPhone,
            fromAddress: fromUser.walletAddress,
            toAddress: toUser.walletAddress,
            amount: parseFloat(amount),
            fee: fee,
            total: parseFloat(amount) + fee,
            timestamp: new Date().toISOString(),
            status: 'confirmed',
            type: 'transfer',
            blockHeight: this.blockHeight
        };

        // Create fee transaction
        const feeTransaction = {
            id: security.generateTransactionId(),
            from: fromPhone,
            to: security.getFeeCollector(),
            fromAddress: fromUser.walletAddress,
            toAddress: feeCollector ? feeCollector.walletAddress : 'FEE_WALLET',
            amount: parseFloat(fee),
            fee: 0,
            total: parseFloat(fee),
            timestamp: new Date().toISOString(),
            status: 'confirmed',
            type: 'fee',
            blockHeight: this.blockHeight,
            relatedTx: mainTransaction.id
        };

        // Sign transactions
        mainTransaction.signature = security.hashPassword(
            mainTransaction.from + mainTransaction.to + mainTransaction.amount + mainTransaction.timestamp
        );
        
        feeTransaction.signature = security.hashPassword(
            feeTransaction.from + feeTransaction.to + feeTransaction.amount + feeTransaction.timestamp
        );

        // Add to transaction history
        this.transactions.push(mainTransaction);
        this.transactions.push(feeTransaction);
        
        // Update users' transaction history
        if (!fromUser.transactions) fromUser.transactions = [];
        if (!toUser.transactions) toUser.transactions = [];
        
        fromUser.transactions.push(mainTransaction.id, feeTransaction.id);
        toUser.transactions.push(mainTransaction.id);
        
        if (feeCollector) {
            if (!feeCollector.transactions) feeCollector.transactions = [];
            feeCollector.transactions.push(feeTransaction.id);
        }

        this.blockHeight++;
        this.saveToStorage();

        console.log('Transaction completed successfully. New balances - From:', fromUser.balance, 'To:', toUser.balance);
        
        return {
            amount: amount,
            fee: fee,
            total: amount + fee,
            recipient: toPhone,
            transactionId: mainTransaction.id
        };
    }

    // Add transaction (for compatibility)
    addTransaction(transaction) {
        this.transactions.push({
            ...transaction,
            id: security.generateTransactionId(),
            timestamp: new Date().toISOString(),
            status: 'confirmed'
        });
        this.saveToStorage();
    }

    // Get user's transaction history
    getUserTransactions(phoneNumber) {
        const user = this.users.get(phoneNumber);
        if (!user || !user.transactions) {
            return [];
        }

        // Get all transactions involving this user
        const userTxs = this.transactions.filter(tx => 
            tx.from === phoneNumber || tx.to === phoneNumber
        );
        
        return userTxs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Get user by phone number (public info only)
    getUserProfile(phoneNumber) {
        const user = this.users.get(phoneNumber);
        if (!user) return null;

        return {
            phoneNumber: user.phoneNumber,
            walletAddress: user.walletAddress,
            isActive: user.isActive,
            createdAt: user.createdAt,
            balance: user.balance
        };
    }

    // Add funds (for demo purposes)
    addFunds(phoneNumber, amount) {
        const user = this.users.get(phoneNumber);
        if (!user) {
            throw new Error('📵User not found');
        }

        // Check if account is frozen
        if (user.frozen) {
            throw new Error(`☢️Account frozen. Reason: ${user.freezeReason || 'Security concerns'}. Cannot add funds.`);
        }

        // Check if account is suspended
        if (!user.isActive) {
            throw new Error(`☢️Account suspended. Reason: ${user.suspendReason || 'Violation of terms of service'}. Cannot add funds.`);
        }

        user.balance = (parseFloat(user.balance) || 0) + parseFloat(amount);
        
        // Create funding transaction
        const transaction = {
            id: security.generateTransactionId(),
            from: 'system',
            to: phoneNumber,
            fromAddress: 'SYSTEM_WALLET',
            toAddress: user.walletAddress,
            amount: parseFloat(amount),
            timestamp: new Date().toISOString(),
            status: 'confirmed',
            type: 'funding',
            blockHeight: this.blockHeight++
        };

        this.transactions.push(transaction);
        if (!user.transactions) user.transactions = [];
        user.transactions.push(transaction.id);

        this.saveToStorage();
        return transaction;
    }

    // Check if user exists
    userExists(phoneNumber) {
        return this.users.has(phoneNumber);
    }

    // Storage management WITH BACKUP INTEGRATION
    saveToStorage() {
        try {
            const data = {
                users: Array.from(this.users.entries()),
                transactions: this.transactions,
                blockHeight: this.blockHeight
            };
            localStorage.setItem('phonechain_data', JSON.stringify(data));
            console.log('Data saved to storage. Total users:', this.users.size);
            
            // AUTO-BACKUP INTEGRATION
            if (typeof backupSystem !== 'undefined') {
                backupSystem.createBackup();
            }
        } catch (error) {
            console.error('📵Failed to save data:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('phonechain_data');
            if (data) {
                const parsed = JSON.parse(data);
                this.users = new Map(parsed.users);
                this.transactions = parsed.transactions || [];
                this.blockHeight = parsed.blockHeight || 0;
                console.log('✅Data loaded from storage. Users:', this.users.size);
            }
        } catch (error) {
            console.error('❌Failed to load data:', error);
            this.users = new Map();
            this.transactions = [];
            this.blockHeight = 0;
        }
    }

    // Get system statistics
    getSystemStats() {
        const feeCollector = this.users.get(security.getFeeCollector());
        const totalFees = feeCollector ? feeCollector.balance : 0;
        
        return {
            totalUsers: this.users.size,
            totalTransactions: this.transactions.length,
            blockHeight: this.blockHeight,
            totalValue: Array.from(this.users.values()).reduce((sum, user) => sum + (parseFloat(user.balance) || 0), 0),
            totalFees: totalFees,
            feeCollector: security.getFeeCollector()
        };
    }
}

// Global blockchain instance
const blockchain = new PhoneBlockchain();