// Main Application Logic - FINAL CORRECTED VERSION with Password Strength
class PhoneChainApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.setupEventListeners();
        this.updateSecurityStatus();
        this.startPeriodicUpdates();
    }

    setupEventListeners() {
        // Enter key support for forms
        document.getElementById('password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        document.getElementById('regPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });

        document.getElementById('confirmPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });

        document.getElementById('txPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMoney();
        });

        // Input validation
        document.getElementById('phoneNumber')?.addEventListener('input', this.formatPhoneNumber);
        document.getElementById('regPhone')?.addEventListener('input', this.formatPhoneNumber);
        document.getElementById('recipientPhone')?.addEventListener('input', this.formatPhoneNumber);
        
        // Password strength indicator
        document.getElementById('regPassword')?.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
        
        // Send amount input for fee display
        document.getElementById('sendAmount')?.addEventListener('input', () => {
            if (document.getElementById('sendSection').classList.contains('active')) {
                this.updateFeeDisplay();
            }
        });
    }

    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            value = '+' + value;
        }
        e.target.value = value;
    }

    // Password strength indicator
    updatePasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength') || this.createPasswordStrengthIndicator();
        const strength = this.calculatePasswordStrength(password);
        
        strengthIndicator.innerHTML = `
            <div style="margin: 10px 0; font-size: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Password Strength:</span>
                    <span style="color: ${strength.color}; font-weight: bold;">${strength.text}</span>
                </div>
                <div style="height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${strength.percent}%; background: ${strength.color}; transition: all 0.3s;"></div>
                </div>
                <div style="font-size: 12px; color: #718096; margin-top: 5px;">
                    ${strength.requirements}
                </div>
            </div>
        `;
    }

    createPasswordStrengthIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'passwordStrength';
        const regPassword = document.getElementById('regPassword');
        if (regPassword && regPassword.parentNode) {
            regPassword.parentNode.insertBefore(indicator, regPassword.nextSibling);
        }
        return indicator;
    }

    calculatePasswordStrength(password) {
        if (!password) {
            return { text: 'None', color: '#718096', percent: 0, requirements: 'Enter a password' };
        }

        let score = 0;
        let requirements = [];

        // Length check
        if (password.length >= 8) {
            score += 25;
            requirements.push('✅ 8+ characters');
        } else {
            requirements.push('❌ 8+ characters needed');
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            score += 25;
            requirements.push('✅ Lowercase letter');
        } else {
            requirements.push('❌ Lowercase letter needed');
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            score += 25;
            requirements.push('✅ Uppercase letter');
        } else {
            requirements.push('❌ Uppercase letter needed');
        }

        // Number check
        if (/[0-9]/.test(password)) {
            score += 15;
            requirements.push('✅ Number');
        } else {
            requirements.push('❌ Number needed');
        }

        // Special character check
        if (/[^A-Za-z0-9]/.test(password)) {
            score += 10;
            requirements.push('✅ Special character');
        } else {
            requirements.push('❌ Special character needed');
        }

        // Determine strength level
        if (score >= 90) {
            return { text: 'Very Strong', color: '#38a169', percent: 100, requirements: requirements.join('<br>') };
        } else if (score >= 70) {
            return { text: 'Strong', color: '#48bb78', percent: 80, requirements: requirements.join('<br>') };
        } else if (score >= 50) {
            return { text: 'Medium', color: '#ed8936', percent: 60, requirements: requirements.join('<br>') };
        } else if (score >= 25) {
            return { text: 'Weak', color: '#e53e3e', percent: 40, requirements: requirements.join('<br>') };
        } else {
            return { text: 'Very Weak', color: '#c53030', percent: 20, requirements: requirements.join('<br>') };
        }
    }

    checkExistingSession() {
        try {
            const session = database.getSession();
            if (session && session.phoneNumber) {
                const user = blockchain.users.get(session.phoneNumber);
                if (user) {
                    this.currentUser = user;
                    security.startSession(user);
                    this.showDashboard();
                }
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    }

    // Authentication
    async login() {
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const password = document.getElementById('password').value;

        if (!phoneNumber || !password) {
            this.showNotification('❌Please enter phone number and password', 'error');
            return;
        }

        if (!security.validatePhoneNumber(phoneNumber)) {
            this.showNotification('❌Please enter a valid phone number', 'error');
            return;
        }

        try {
            console.log('Attempting login for:', phoneNumber);
            const user = blockchain.authenticateUser(phoneNumber, password);
            this.currentUser = user;
            security.startSession(user);
            
            database.saveSession({
                phoneNumber: user.phoneNumber,
                walletAddress: user.walletAddress,
                loginTime: new Date().toISOString()
            });

            this.showDashboard();
            this.showNotification('✅Login successful!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async register() {
        const phoneNumber = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!phoneNumber || !password || !confirmPassword) {
            this.showNotification('📵Please fill all fields', 'error');
            return;
        }

        if (!security.validatePhoneNumber(phoneNumber)) {
            this.showNotification('📵Please enter a valid phone number', 'error');
            return;
        }

        // Check password strength
        const strength = this.calculatePasswordStrength(password);
        if (strength.text === 'Very Weak' || strength.text === 'Weak') {
            if (!confirm(`📵Your password is ${strength.text.toLowerCase()}. Are you sure you want to continue❓`)) {
                return;
            }
        }

        if (!security.validatePassword(password)) {
            this.showNotification('📵Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('📵Passwords do not match', 'error');
            return;
        }

        try {
            const user = blockchain.registerUser(phoneNumber, password);
            this.currentUser = user;
            security.startSession(user);
            database.saveSession({
                phoneNumber: user.phoneNumber,
                walletAddress: user.walletAddress,
                loginTime: new Date().toISOString()
            });

            this.showDashboard();
            this.showNotification('Account created successfully! Welcome to M-USD !', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    logout() {
        security.logout();
        database.clearSession();
        this.currentUser = null;
        this.showLogin();
        this.showNotification('👋Logged out successfully', 'success');
    }

    // Transaction handling
    async sendMoney() {
        if (!this.currentUser) {
            this.showNotification('📵Please login first', 'error');
            return;
        }

        const recipientPhone = document.getElementById('recipientPhone').value.trim();
        const amount = parseFloat(document.getElementById('sendAmount').value);
        const password = document.getElementById('txPassword').value;

        if (!recipientPhone || !amount || !password) {
            this.showNotification('📵Please fill all fields', 'error');
            return;
        }

        if (recipientPhone === this.currentUser.phoneNumber) {
            this.showNotification('📵Cannot send to yourself', 'error');
            return;
        }

        if (amount <= 0) {
            this.showNotification('📵Amount must be positive', 'error');
            return;
        }

        // Show fee information
        const fee = security.calculateTransactionFee(amount);
        const total = amount + fee;

        if (!confirm(`Send ${amount} USD to ${recipientPhone}?\nTransaction fee: ${fee.toFixed(2)} USD\nTotal: ${total.toFixed(2)} USD`)) {
            return;
        }

        try {
            const result = blockchain.sendMoney(
                this.currentUser.phoneNumber, 
                recipientPhone, 
                amount, 
                password
            );

            this.hideSend();
            this.updateDashboard();
            this.showNotification(
                `Confirmed you have successfully sent ${amount} USD to ${recipientPhone}\nFee: ${fee.toFixed(2)} USD sent to ${security.getFeeCollector()}`, 
                'success'
            );

            // Clear form
            document.getElementById('recipientPhone').value = '';
            document.getElementById('sendAmount').value = '';
            document.getElementById('txPassword').value = '';

        } catch (error) {
            console.error('Send money error:', error);
            this.showNotification(error.message, 'error');
        }
    }

    addFunds() {
        if (!this.currentUser) {
            this.showNotification('Please login first', 'error');
            return;
        }

        const amount = 50; // Demo amount
        try {
            blockchain.addFunds(this.currentUser.phoneNumber, amount);
            this.updateDashboard();
            this.showNotification(
                `Added ${amount} USD to your wallet (demo mode)`, 
                'success'
            );
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Fee display
    updateFeeDisplay() {
        const amount = parseFloat(document.getElementById('sendAmount').value) || 0;
        const fee = security.calculateTransactionFee(amount);
        const total = amount + fee;
        
        const feeInfo = document.getElementById('feeInfo') || (() => {
            const div = document.createElement('div');
            div.id = 'feeInfo';
            div.style.cssText = 'background: #f0f8ff; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 14px;';
            document.querySelector('#sendSection .form-group').insertBefore(div, document.querySelector('#sendSection .btn'));
            return div;
        })();
        
        if (amount > 0) {
            feeInfo.innerHTML = `💰 Transaction Details:<br>
                                Amount: ${amount.toFixed(2)} USD<br>
                                Fee (1%): ${fee.toFixed(2)} USD<br>
                                <strong>Total: ${total.toFixed(2)} USD</strong><br>
                                <small>Fee goes to: ${security.getFeeCollector()}</small>`;
            feeInfo.style.display = 'block';
        } else {
            feeInfo.style.display = 'none';
        }
    }

    // UI Navigation
    showLogin() {
        this.hideAllScreens();
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('phoneNumber').value = '';
        document.getElementById('password').value = '';
    }

    showRegister() {
        this.hideAllScreens();
        document.getElementById('registerScreen').classList.add('active');
        document.getElementById('regPhone').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        // Clear password strength indicator
        const strengthIndicator = document.getElementById('passwordStrength');
        if (strengthIndicator) {
            strengthIndicator.innerHTML = '';
        }
    }

    showDashboard() {
        this.hideAllScreens();
        document.getElementById('dashboard').classList.add('active');
        this.updateDashboard();
    }

    showSend() {
        this.hideAllSections();
        document.getElementById('sendSection').classList.add('active');
        this.updateFeeDisplay();
    }

    showReceive() {
        this.hideAllSections();
        document.getElementById('receiveSection').classList.add('active');
        if (this.currentUser) {
            document.getElementById('userAddress').textContent = this.currentUser.phoneNumber;
        }
    }

    showHistory() {
        this.hideAllSections();
        document.getElementById('historySection').classList.add('active');
        this.loadTransactionHistory();
    }

    hideSend() {
        document.getElementById('sendSection').classList.remove('active');
        const feeInfo = document.getElementById('feeInfo');
        if (feeInfo) feeInfo.style.display = 'none';
    }

    hideReceive() {
        document.getElementById('receiveSection').classList.remove('active');
    }

    hideHistory() {
        document.getElementById('historySection').classList.remove('active');
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    hideAllSections() {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
    }

    // Data updates
    updateDashboard() {
        if (!this.currentUser) return;

        try {
            // Refresh user data
            const freshUser = blockchain.users.get(this.currentUser.phoneNumber);
            if (freshUser) {
                this.currentUser.balance = parseFloat(freshUser.balance) || 0;
            }

            document.getElementById('userPhone').textContent = this.currentUser.phoneNumber;
            document.getElementById('balanceAmount').textContent = this.currentUser.balance.toFixed(2);
            document.getElementById('userAddress').textContent = this.currentUser.phoneNumber;

            this.updateSecurityStatus();
        } catch (error) {
            console.error('Dashboard update error:', error);
        }
    }

    loadTransactionHistory() {
        if (!this.currentUser) return;

        try {
            const transactions = blockchain.getUserTransactions(this.currentUser.phoneNumber);
            const historyContainer = document.getElementById('transactionHistory');
            
            if (transactions.length === 0) {
                historyContainer.innerHTML = '<div class="transaction-item">No transactions yet</div>';
                return;
            }

            historyContainer.innerHTML = transactions.map(transaction => {
                const isSend = transaction.from === this.currentUser.phoneNumber;
                const otherParty = isSend ? transaction.to : transaction.from;
                const amountClass = isSend ? 'negative' : 'positive';
                const typeIcon = transaction.type === 'fee' ? '💰' : (isSend ? '📤' : '📥');
                const typeText = transaction.type === 'fee' ? 'Transaction Cost' : (isSend ? 'Confirmed.You have sent' : 'Confirmed.You have received ');
                
                // Show reason for admin deductions
                const reasonText = transaction.reason ? `<div class="transaction-reason"><small>Reason: ${transaction.reason}</small></div>` : '';

                return `
                    <div class="transaction-item ${isSend ? 'send' : 'receive'}">
                        <div class="transaction-info">
                            <div class="transaction-type">${typeIcon} ${typeText}</div>
                            <div class="transaction-party">${otherParty}</div>
                            <div class="transaction-date">${new Date(transaction.timestamp).toLocaleDateString()}</div>
                            ${transaction.type === 'fee' ? '<div class="transaction-fee">Network Fee</div>' : ''}
                            ${reasonText}
                        </div>
                        <div class="transaction-amount ${amountClass}">
                            ${isSend ? '-' : '+'}${transaction.amount.toFixed(2)} USD
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Load history error:', error);
            document.getElementById('transactionHistory').innerHTML = '<div class="transaction-item">Error loading transactions</div>';
        }
    }
    
showLoading(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.innerHTML = `
        <div class="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        </div>
    `;
    document.body.appendChild(loader);
}

hideLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.remove();
}

// Use in all async operations
async sendMoney() {
    this.showLoading('Processing transaction...');
    try {
        // your existing code
    } finally {
        this.hideLoading();
    }
}
    

    updateSecurityStatus() {
        const sessionStatus = document.getElementById('sessionStatus');
        if (security.isSessionValid()) {
            sessionStatus.innerHTML = '<span class="status good">●</span> Honest';
        } else {
            sessionStatus.innerHTML = '<span class="status warning">●</span> Intellect';
        }
    }
    updateErrorLogs() {
        const container = document.getElementById('errorLogs');
        if (!container) return;
        
        const recentErrors = aiMonitor.errors.slice(-10).reverse();
        
        if (recentErrors.length === 0) {
            container.innerHTML = '<div class="no-data">No recent errors</div>';
            return;
        }
        
        container.innerHTML = recentErrors.map(error => `
            <div class="error-log">
                <strong>${error.type}</strong><br>
                ${error.message}<br>
                <small>${new Date(error.timestamp).toLocaleString()}</small>
            </div>
        `).join('');
    }

    updateCorrectionLogs() {
        const container = document.getElementById('correctionLogs');
        if (!container) return;
        
        const recentCorrections = aiMonitor.corrections.slice(-10).reverse();
        
        if (recentCorrections.length === 0) {
            container.innerHTML = '<div class="no-data">No recent corrections</div>';
            return;
        }
        
        container.innerHTML = recentCorrections.map(correction => `
            <div class="correction-log">
                <strong>${correction.type}</strong><br>
                ${correction.message}<br>
                <small>${new Date(correction.timestamp).toLocaleString()} - ${correction.status}</small>
            </div>
        `).join('');
    }

    runSecurityScan() {
        const results = enhancedSecurity.securityScan();
        this.showNotification(`Security scan completed. Found ${results.issues.length} issues.`, 'success');
        this.updateSecurityDashboard();
    }

    // Periodic updates
    startPeriodicUpdates() {
        // Update connection status every 5 seconds
        
    }

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        setTimeout(() => {
            notification.classList.remove('success', 'error', 'warning');
        }, 5000);
    }

    // Utility functions
    formatCurrency(amount) {
        return parseFloat(amount).toFixed(2);
    }

    formatPhone(phone) {
        return phone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }
    
    
    
    
    
    
    
// Add to PhoneChainApp class
showDepositOptions() {
    const amount = parseFloat(prompt('Enter amount to deposit (USD):')) || 0;
    if (amount <= 0) {
        this.showNotification('Please enter a valid amount', 'error');
        return;
    }

    if (amount > 1000000) {
        this.showNotification('Maximum deposit is $1,000,000', 'error');
        return;
    }

    this.showDepositModal(amount);
}

showDepositModal(amount = null) {
    if (!amount) {
        amount = parseFloat(prompt('Enter deposit amount (USD):')) || 0;
        if (amount <= 0) return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
            <h2>💳 Deposit USD</h2>
            <p style="font-size: 1.2em; text-align: center; margin: 20px 0;">
                <strong>Amount: $${amount.toFixed(2)}</strong>
            </p>
            
            <div class="payment-methods" style="display: grid; gap: 10px; margin: 20px 0;">
                <button onclick="paymentGateway.processStripePayment(${amount}, '${this.currentUser.phoneNumber}')" 
                        class="btn" style="background: #635bff; color: white; padding: 15px; text-align: left;">
                    <span>💳</span> Credit/Debit Card (Stripe)
                </button>
                
                <button onclick="paymentGateway.processPayPalPayment(${amount}, '${this.currentUser.phoneNumber}')" 
                        class="btn" style="background: #0070ba; color: white; padding: 15px; text-align: left;">
                    <span>📊</span> PayPal
                </button>
                
                <button onclick="paymentGateway.processBankTransfer(${amount}, '${this.currentUser.phoneNumber}')" 
                        class="btn" style="background: #38a169; color: white; padding: 15px; text-align: left;">
                    <span>🏦</span> Bank Transfer
                </button>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4>💰 Instant Funding</h4>
                <p>Credit card and PayPal deposits are instant. Bank transfers take 1-2 business days.</p>
            </div>
            
            <button onclick="this.closest('[style]').remove()" class="btn secondary" style="width: 100%;">
                Cancel
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}



}
// Add global functions
function showDepositOptions() { app.showDepositOptions(); }
function showDepositModal(provider) { 
    const amount = parseFloat(prompt('Enter deposit amount (USD):')) || 0;
    if (amount > 0) {
        if (provider === 'stripe') {
            paymentGateway.processStripePayment(amount, app.currentUser.phoneNumber);
        } else if (provider === 'paypal') {
            paymentGateway.processPayPalPayment(amount, app.currentUser.phoneNumber);
        }
    }
}
    
// Add to PhoneChainApp class
openAdminPanel() 
{
    window.location.href = 'admin.html';
}

// Add to global functions
function openAdminPanel() { app.openAdminPanel(); }

// Global functions for HTML onclick handlers
function login() { app.login(); }
function register() { app.register(); }
function logout() { app.logout(); }
function showRegister() { app.showRegister(); }
function showLogin() { app.showLogin(); }
function showSend() { app.showSend(); }
function showReceive() { app.showReceive(); }
function showHistory() { app.showHistory(); }
function hideSend() { app.hideSend(); }
function hideReceive() { app.hideReceive(); }
function hideHistory() { app.hideHistory(); }
function sendMoney() { app.sendMoney(); }
function addFunds() { app.addFunds(); }
function switchConnectionMode(mode) { app.switchConnectionMode(mode); }
function emergencyCleanup() { app.emergencyCleanup(); }
function emergencyUnlockAll() { app.emergencyUnlockAll(); }
function runSecurityScan() { app.runSecurityScan(); }

// Initialize app when page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PhoneChainApp();
});