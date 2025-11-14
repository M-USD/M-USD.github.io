// Security and Encryption Utilities - WITH CONFIG INTEGRATION
class SecurityManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = (CONFIG && CONFIG.SECURITY && CONFIG.SECURITY.SESSION_TIMEOUT) || (30 * 60 * 1000); // 30 minutes default
        this.TRANSACTION_FEE_PERCENT = (CONFIG && CONFIG.BLOCKCHAIN && CONFIG.BLOCKCHAIN.FEE_PERCENT) || 0.01; // 1% default
        this.FEE_COLLECTOR = (CONFIG && CONFIG.BLOCKCHAIN && CONFIG.BLOCKCHAIN.FEE_COLLECTOR) || "+254746500025"; // Configurable fee collector
        this.PASSWORD_MIN_LENGTH = (CONFIG && CONFIG.SECURITY && CONFIG.SECURITY.PASSWORD_MIN_LENGTH) || 6; // Minimum password length
    }
    
    
    
    

    // Simple hash function for demonstration
    hashPassword(password) {
        if (!password) return '';
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(32, '0');
    }
    
    // Generate a unique wallet address from phone number
    generateWalletAddress(phoneNumber) {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        let hash = 0;
        for (let i = 0; i < cleanPhone.length; i++) {
            const char = cleanPhone.charCodeAt(i);
            hash = ((hash << 7) - hash) + char;
            hash = hash & hash;
        }
        return 'PHONE_' + Math.abs(hash).toString(16).padStart(40, '0');
    }
    
    // Simple hash function for general data
    simpleHash(data) {
        if (!data) return '';
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }
    
    // Generate key pair for wallet
    generateKeyPair() {
        const privateKey = '0x' + Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)).join('');
        
        const publicKey = this.simpleHash(privateKey);
        const address = '0x' + publicKey.substring(0, 40);
        
        return {
            privateKey,
            publicKey,
            address
        };
    }
    
    // Calculate transaction fee
    calculateTransactionFee(amount) {
        const fee = amount * this.TRANSACTION_FEE_PERCENT;
        const minFee = (CONFIG && CONFIG.BLOCKCHAIN && CONFIG.BLOCKCHAIN.MIN_FEE) || 0.01;
        return Math.max(fee, minFee); // Configurable minimum fee
    }
    
    // Get fee collector number
    getFeeCollector() {
        return this.FEE_COLLECTOR;
    }
    
    // Encrypt sensitive data
    encryptData(data, password) {
        try {
            if (!data || !password) return data;
            const key = this.hashPassword(password);
            let result = '';
            for (let i = 0; i < data.length; i++) {
                const dataChar = data.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                result += String.fromCharCode(dataChar ^ keyChar);
            }
            return btoa(result);
        } catch (error) {
            console.error('☢️Encryption error:', error);
            return data;
        }
    }
    
    // Decrypt sensitive data
    decryptData(encryptedData, password) {
        try {
            if (!encryptedData || !password) return encryptedData;
            
            // If it doesn't look like Base64, return as is
            if (!encryptedData.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
                return encryptedData;
            }
            
            const key = this.hashPassword(password);
            const data = atob(encryptedData);
            let result = '';
            for (let i = 0; i < data.length; i++) {
                const dataChar = data.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                result += String.fromCharCode(dataChar ^ keyChar);
            }
            return result;
        } catch (error) {
            console.error('☢️Decryption error:', error);
            return encryptedData;
        }
    }
    
    
    
    
    
    
    
    
    // Validate phone number format
    validatePhoneNumber(phone) {
        if (!phone) return false;
        const phoneRegex = /^[\+\d][\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }
    
    // Validate password strength
    validatePassword(password) {
        return password && password.length >= this.PASSWORD_MIN_LENGTH;
    }
    
    // Generate transaction ID
    generateTransactionId() {
        return 'TX_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Verify transaction signature
    verifyTransaction(transaction, userPassword) {
        try {
            const expectedHash = this.hashPassword(
                transaction.from +
                transaction.to +
                transaction.amount +
                transaction.timestamp
            );
            return transaction.signature === expectedHash;
        } catch (error) {
            return false;
        }
    }
    
    // Session management
    startSession(user) {
        this.currentUser = user;
        this.sessionStart = Date.now();
        
        // Auto logout after timeout
        this.sessionTimer = setTimeout(() => {
            this.logout();
            if (typeof showNotification === 'function') {
                showNotification('❌Session expired. Please login again.', 'warning');
            }
        }, this.sessionTimeout);
    }
    
    logout() {
        this.currentUser = null;
        this.sessionStart = null;
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
    }
    
    isSessionValid() {
        if (!this.sessionStart) return false;
        return (Date.now() - this.sessionStart) < this.sessionTimeout;
    }
    
    // Password verification
    verifyPassword(inputPassword, storedHash) {
        if (!inputPassword || !storedHash) return false;
        return this.hashPassword(inputPassword) === storedHash;
    }
    
    
    
}







// Global security instance
const security = new SecurityManager();