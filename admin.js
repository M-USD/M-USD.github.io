// Safe fallback for enhancedSecurity
if (typeof enhancedSecurity === 'undefined') {
    var enhancedSecurity = {
        getSecurityReport: function() {
            return {
                timestamp: new Date().toISOString(),
                lockedAccounts: [],
                failedAttempts: [],
                recentSuspiciousActivities: [],
                securityScan: { issues: [] }
            };
        },
        securityScan: function() {
            return { issues: [] };
        },
        emergencyUnlockAll: function() {
            return 0;
        }
    };
}
// Admin Panel Management System
class AdminPanel {
    constructor() {
        this.adminPassword = "admin2024"; // Default admin password
        this.isAuthenticated = false;
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.checkAdminSession();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }

    checkAdminSession() {
        try {
            const session = localStorage.getItem('admin_session');
            if (session && JSON.parse(session).authenticated) {
                this.isAuthenticated = true;
                this.showDashboard();
            }
        } catch (error) {
            console.error('Admin session check error:', error);
        }
    }

    login() {
        const password = document.getElementById('adminPassword').value;
        
        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            localStorage.setItem('admin_session', JSON.stringify({
                authenticated: true,
                loginTime: new Date().toISOString()
            }));
            this.showDashboard();
            this.showNotification('Admin login successful', 'success');
        } else {
            this.showNotification('Invalid admin password', 'error');
        }
    }

    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('admin_session');
        this.showLogin();
        this.showNotification('Admin logged out', 'success');
    }

    showLogin() {
        this.hideAllScreens();
        document.getElementById('adminLoginScreen').classList.add('active');
        document.getElementById('adminPassword').value = '';
    }

    showDashboard() {
        this.hideAllScreens();
        document.getElementById('adminDashboard').classList.add('active');
        this.updateDashboard();
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    // Section Management
    showSection(sectionName) {
        this.currentSection = sectionName;
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionName + 'Section').classList.add('active');
        
        // Load section data
        this.loadSectionData(sectionName);
    }

    loadSectionData(sectionName) {
        switch(sectionName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'users':
                this.loadUsersList();
                break;
            case 'transactions':
                this.loadAllTransactions();
                break;
            case 'system':
                this.updateSystemInfo();
                break;
        }
    }

    // Dashboard Management
    updateDashboard() {
        this.updateSystemStats();
        this.updateSystemStatus();
    }










    updateSystemStats() {
        const stats = blockchain.getSystemStats();
        
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalTransactions').textContent = stats.totalTransactions;
        document.getElementById('totalBalance').textContent = stats.totalValue.toFixed(2);
        document.getElementById('totalFees').textContent = stats.totalFees.toFixed(2);
    }

    updateSystemStatus() {
        const statusContainer = document.getElementById('systemStatus');
        const securityReport = enhancedSecurity.getSecurityReport();
        const aiReport = aiMonitor.getSystemReport();
        
        statusContainer.innerHTML = `
            <div class="security-item">
                <span class="status good">●</span>
                Blockchain Height: ${blockchain.blockHeight}
            </div>
            <div class="security-item">
                <span class="status good">●</span>
                Users: ${blockchain.users.size} active
            </div>
            <div class="security-item">
                <span class="status good">●</span>
                Transactions: ${blockchain.transactions.length}
            </div>
            <div class="security-item">
                <span class="status ${securityReport.lockedAccounts.length > 0 ? 'warning' : 'good'}">●</span>
                Locked Accounts: ${securityReport.lockedAccounts.length}
            </div>
        `;
    }

    updateSystemInfo() {
        const infoContainer = document.getElementById('systemInfo');
        const stats = blockchain.getSystemStats();
        const securityReport = enhancedSecurity.getSecurityReport();
        
        infoContainer.innerHTML = `
            <div class="security-items">
                <div class="security-item">
                    <span class="status good">●</span>
                    System Version: 2.0.0
                </div>
                <div class="security-item">
                    <span class="status good">●</span>
                    Total Users: ${stats.totalUsers}
                </div>
                <div class="security-item">
                    <span class="status good">●</span>
                    Suspended Users: ${stats.suspendedUsers || 0}
                </div>
                <div class="security-item">
                    <span class="status good">●</span>
                    Frozen Accounts: ${stats.frozenUsers || 0}
                </div>
                <div class="security-item">
                    <span class="status good">●</span>
                    Total Balance: ${stats.totalValue.toFixed(2)} USD
                </div>
                <div class="security-item">
                    <span class="status good">●</span>
                    Collected Fees: ${stats.totalFees.toFixed(2)} USD
                </div>
            </div>
        `;
    }

    // User Management
    loadUsersList() {
        const usersList = document.getElementById('usersList');
        const users = Array.from(blockchain.users.values());
        
        if (users.length === 0) {
            usersList.innerHTML = '<div class="no-data">No users found</div>';
            return;
        }

        usersList.innerHTML = users.map(user => {
            const isSuspended = !user.isActive;
            const isFrozen = user.frozen || false;
            const balance = parseFloat(user.balance) || 0;
            
            return `
                <div class="user-item ${isSuspended ? 'suspended' : ''} ${isFrozen ? 'frozen' : ''}">
                    <div class="user-info">
                        <div class="user-phone"><strong>${user.phoneNumber}</strong></div>
                        <div class="user-details">
                            Balance: ${balance.toFixed(2)} USD | 
                            Created: ${new Date(user.createdAt).toLocaleDateString()} |
                            ${isSuspended ? '🔴 SUSPENDED' : '🟢 ACTIVE'}
                            ${isFrozen ? ' | ❄️ FROZEN' : ''}
                        </div>
                        ${isSuspended ? `<div class="user-reason"><small>Reason: ${user.suspendReason || 'Not specified'}</small></div>` : ''}
                        ${isFrozen ? `<div class="user-reason"><small>Freeze Reason: ${user.freezeReason || 'Not specified'}</small></div>` : ''}
                    </div>
                    <div class="user-actions">
                        <button onclick="admin.showUserActions('${user.phoneNumber}')" class="btn small">Actions</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    searchUsers() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        const users = Array.from(blockchain.users.values());
        const filteredUsers = users.filter(user => 
            user.phoneNumber.toLowerCase().includes(searchTerm)
        );
        
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = filteredUsers.map(user => {
            const isSuspended = !user.isActive;
            const isFrozen = user.frozen || false;
            const balance = parseFloat(user.balance) || 0;
            
            return `
                <div class="user-item ${isSuspended ? 'suspended' : ''} ${isFrozen ? 'frozen' : ''}">
                    <div class="user-info">
                        <div class="user-phone"><strong>${user.phoneNumber}</strong></div>
                        <div class="user-details">
                            Balance: ${balance.toFixed(2)} USD | 
                            Created: ${new Date(user.createdAt).toLocaleDateString()} |
                            ${isSuspended ? '🔴 SUSPENDED' : '🟢 ACTIVE'}
                            ${isFrozen ? ' | ❄️ FROZEN' : ''}
                        </div>
                        ${isSuspended ? `<div class="user-reason"><small>Reason: ${user.suspendReason || 'Not specified'}</small></div>` : ''}
                        ${isFrozen ? `<div class="user-reason"><small>Freeze Reason: ${user.freezeReason || 'Not specified'}</small></div>` : ''}
                    </div>
                    <div class="user-actions">
                        <button onclick="admin.showUserActions('${user.phoneNumber}')" class="btn small">Actions</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showUserActions(phoneNumber) {
        const user = blockchain.users.get(phoneNumber);
        if (!user) return;

        const modal = document.getElementById('userActionModal');
        const modalContent = document.getElementById('modalContent');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = `User: ${phoneNumber}`;
        
        modalContent.innerHTML = `
            <div class="user-details">
                <p><strong>Wallet Address:</strong> ${user.walletAddress}</p>
                <p><strong>Balance:</strong> ${(parseFloat(user.balance) || 0).toFixed(2)} USD</p>
                <p><strong>Status:</strong> ${user.isActive ? '🟢 Active' : '🔴 Suspended'}</p>
                <p><strong>Frozen:</strong> ${user.frozen ? '❄️ Yes' : '🟢 No'}</p>
                <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
                ${!user.isActive ? `<p><strong>Suspension Reason:</strong> ${user.suspendReason || 'Not specified'}</p>` : ''}
                ${user.frozen ? `<p><strong>Freeze Reason:</strong> ${user.freezeReason || 'Not specified'}</p>` : ''}
            </div>
            
            <div class="form-group">
                <label>Account Actions:</label>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="admin.showSuspendAccount('${phoneNumber}')" class="btn ${user.isActive ? 'danger' : 'primary'}">
                        ${user.isActive ? 'Suspend Account' : 'Activate Account'}
                    </button>
                    <button onclick="admin.showFreezeAccount('${phoneNumber}')" class="btn ${user.frozen ? 'primary' : 'warning'}">
                        ${user.frozen ? 'Unfreeze Account' : 'Freeze Account'}
                    </button>
                    <button onclick="admin.showDeductFunds('${phoneNumber}')" class="btn danger">
                        Deduct Funds
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label>Transaction History:</label>
                <button onclick="admin.showUserTransactions('${phoneNumber}')" class="btn secondary small">
                    View Transactions
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    showSuspendAccount(phoneNumber) {
        const user = blockchain.users.get(phoneNumber);
        if (!user) return;

        const modalContent = document.getElementById('modalContent');
        const action = user.isActive ? 'suspend' : 'activate';
        
        if (action === 'suspend') {
            modalContent.innerHTML = `
                <div class="form-group">
                    <label for="suspendReason">Reason for Suspension:</label>
                    <select id="suspendReason" style="width: 100%; padding: 10px; margin: 10px 0;">
                        <option value="Violation of terms of service">Violation of terms of service</option>
                        <option value="Suspicious activity">Suspicious activity</option>
                        <option value="Account verification required">Account verification required</option>
                        <option value="Reported by other users">Reported by other users</option>
                        <option value="Other">Other (specify below)</option>
                    </select>
                    <input type="text" id="customSuspendReason" placeholder="Specify other reason" style="width: 100%; padding: 10px; margin: 10px 0; display: none;">
                </div>
                <div class="form-group">
                    <button onclick="admin.toggleAccountStatus('${phoneNumber}')" class="btn danger">Suspend Account</button>
                    <button onclick="admin.showUserActions('${phoneNumber}')" class="btn secondary">Cancel</button>
                </div>
                <script>
                    document.getElementById('suspendReason').addEventListener('change', function() {
                        document.getElementById('customSuspendReason').style.display = 
                            this.value === 'Other' ? 'block' : 'none';
                    });
                </script>
            `;
        } else {
            modalContent.innerHTML = `
                <div class="form-group">
                    <p>Activate this account?</p>
                    <button onclick="admin.toggleAccountStatus('${phoneNumber}')" class="btn primary">Activate Account</button>
                    <button onclick="admin.showUserActions('${phoneNumber}')" class="btn secondary">Cancel</button>
                </div>
            `;
        }
    }

    showFreezeAccount(phoneNumber) {
        const user = blockchain.users.get(phoneNumber);
        if (!user) return;

        const modalContent = document.getElementById('modalContent');
        const action = user.frozen ? 'unfreeze' : 'freeze';
        
        if (action === 'freeze') {
            modalContent.innerHTML = `
                <div class="form-group">
                    <label for="freezeReason">Reason for Freezing:</label>
                    <select id="freezeReason" style="width: 100%; padding: 10px; margin: 10px 0;">
                        <option value="Suspicious transaction activity">Suspicious transaction activity</option>
                        <option value="Security concerns">Security concerns</option>
                        <option value="Chargeback dispute">Chargeback dispute</option>
                        <option value="Regulatory compliance">Regulatory compliance</option>
                        <option value="Other">Other (specify below)</option>
                    </select>
                    <input type="text" id="customFreezeReason" placeholder="Specify other reason" style="width: 100%; padding: 10px; margin: 10px 0; display: none;">
                </div>
                <div class="form-group">
                    <button onclick="admin.toggleFreezeAccount('${phoneNumber}')" class="btn warning">Freeze Account</button>
                    <button onclick="admin.showUserActions('${phoneNumber}')" class="btn secondary">Cancel</button>
                </div>
                <script>
                    document.getElementById('freezeReason').addEventListener('change', function() {
                        document.getElementById('customFreezeReason').style.display = 
                            this.value === 'Other' ? 'block' : 'none';
                    });
                </script>
            `;
        } else {
            modalContent.innerHTML = `
                <div class="form-group">
                    <p>Unfreeze this account?</p>
                    <button onclick="admin.toggleFreezeAccount('${phoneNumber}')" class="btn primary">Unfreeze Account</button>
                    <button onclick="admin.showUserActions('${phoneNumber}')" class="btn secondary">Cancel</button>
                </div>
            `;
        }
    }
    toggleAccountStatus(phoneNumber) {
        const user = blockchain.users.get(phoneNumber);
        if (!user) return;

        if (user.isActive) {
            // Suspending account - get reason
            const reasonSelect = document.getElementById('suspendReason');
            const customReason = document.getElementById('customSuspendReason');
            const reason = reasonSelect ? 
                (reasonSelect.value === 'Other' ? customReason.value : reasonSelect.value) 
                : 'Violation of terms of service';
            
            user.isActive = false;
            user.suspendReason = reason || 'Violation of terms of service';
            
            this.showNotification(
                `Account suspended. Reason: ${user.suspendReason}`,
                'success'
            );
        } else {
            // Activating account
            user.isActive = true;
            user.suspendReason = '';
            
            this.showNotification(
                'Account activated successfully',
                'success'
            );
        }
        
        blockchain.saveToStorage();
        this.closeModal();
        this.loadUsersList();
    }

    toggleFreezeAccount(phoneNumber) {
        const user = blockchain.users.get(phoneNumber);
        if (!user) return;

        if (!user.frozen) {
            // Freezing account - get reason
            const reasonSelect = document.getElementById('freezeReason');
            const customReason = document.getElementById('customFreezeReason');
            const reason = reasonSelect ? 
                (reasonSelect.value === 'Other' ? customReason.value : reasonSelect.value) 
                : 'Security concerns';
            
            user.frozen = true;
            user.freezeReason = reason || 'Security concerns';
            
            this.showNotification(
                `Account frozen. Reason: ${user.freezeReason}`,
                'success'
            );
        } else {
            // Unfreezing account
            user.frozen = false;
            user.freezeReason = '';
            
            this.showNotification(
                'Account unfrozen successfully',
                'success'
            );
        }
        
        blockchain.saveToStorage();
        this.closeModal();
        this.loadUsersList();
    }

    showDeductFunds(phoneNumber) {
        const user = blockchain.users.get(phoneNumber);
        if (!user) return;

        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = `
            <div class="form-group">
                <label>Current Balance: ${(parseFloat(user.balance) || 0).toFixed(2)} USD</label>
            </div>
            <div class="form-group">
                <label for="deductAmount">Amount to Deduct (USD):</label>
                <input type="number" id="deductAmount" step="0.01" max="${user.balance}" style="width: 100%; padding: 10px;">
            </div>
            <div class="form-group">
                <label for="deductReason">Reason:</label>
                <select id="deductReason" style="width: 100%; padding: 10px; margin: 10px 0;">
                    <option value="Chargeback processing">Chargeback processing</option>
                    <option value="Fee adjustment">Fee adjustment</option>
                    <option value="Dispute resolution">Dispute resolution</option>
                    <option value="Regulatory requirement">Regulatory requirement</option>
                    <option value="Other">Other (specify below)</option>
                </select>
                <input type="text" id="customDeductReason" placeholder="Specify other reason" style="width: 100%; padding: 10px; margin: 10px 0; display: none;">
            </div>
            <div class="form-group">
                <button onclick="admin.deductFunds('${phoneNumber}')" class="btn danger">Deduct Funds</button>
                <button onclick="admin.showUserActions('${phoneNumber}')" class="btn secondary">Cancel</button>
            </div>
            <script>
                document.getElementById('deductReason').addEventListener('change', function() {
                    document.getElementById('customDeductReason').style.display = 
                        this.value === 'Other' ? 'block' : 'none';
                });
            </script>
        `;
    }

    deductFunds(phoneNumber) {
        const amount = parseFloat(document.getElementById('deductAmount').value);
        const reasonSelect = document.getElementById('deductReason');
        const customReason = document.getElementById('customDeductReason');
        const reason = reasonSelect ? 
            (reasonSelect.value === 'Other' ? customReason.value : reasonSelect.value) 
            : 'Administrative action';
        
        if (!amount || amount <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }

        if (!reason) {
            this.showNotification('Please provide a reason', 'error');
            return;
        }

        const user = blockchain.users.get(phoneNumber);
        if (!user) return;

        const currentBalance = parseFloat(user.balance) || 0;
        if (amount > currentBalance) {
            this.showNotification('Deduction amount exceeds balance', 'error');
            return;
        }

        // Deduct funds
        user.balance = currentBalance - amount;
        
        // Create deduction transaction
        const transaction = {
            id: security.generateTransactionId(),
            from: phoneNumber,
            to: 'system_admin',
            fromAddress: user.walletAddress,
            toAddress: 'ADMIN_WALLET',
            amount: amount,
            timestamp: new Date().toISOString(),
            status: 'confirmed',
            type: 'admin_deduction',
            reason: reason,
            adminAction: true,
            blockHeight: blockchain.blockHeight++
        };

        blockchain.transactions.push(transaction);
        if (!user.transactions) user.transactions = [];
        user.transactions.push(transaction.id);

        blockchain.saveToStorage();
        
        this.showNotification(
            `Deducted ${amount.toFixed(2)} USD from ${phoneNumber}. Reason: ${reason}`,
            'success'
        );
        this.closeModal();
        this.loadUsersList();
        this.updateDashboard();
    }

    showUserTransactions(phoneNumber) {
        const transactions = blockchain.getUserTransactions(phoneNumber);
        const modalContent = document.getElementById('modalContent');
        
        if (transactions.length === 0) {
            modalContent.innerHTML = '<div class="no-data">No transactions found</div>';
            return;
        }

        modalContent.innerHTML = `
            <h3>Transaction History for ${phoneNumber}</h3>
            <div style="max-height: 300px; overflow-y: auto;">
                ${transactions.map(tx => `
                    <div class="transaction-item ${tx.from === phoneNumber ? 'send' : 'receive'}">
                        <div class="transaction-info">
                            <div><strong>${tx.type.toUpperCase()}</strong></div>
                            <div>${tx.from === phoneNumber ? 'To: ' + tx.to : 'From: ' + tx.from}</div>
                            <div>${new Date(tx.timestamp).toLocaleString()}</div>
                            ${tx.reason ? `<div><small><strong>Reason:</strong> ${tx.reason}</small></div>` : ''}
                        </div>
                        <div class="transaction-amount ${tx.from === phoneNumber ? 'negative' : 'positive'}">
                            ${tx.from === phoneNumber ? '-' : '+'}${tx.amount.toFixed(2)} USD
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="form-group">
                <button onclick="admin.closeModal()" class="btn secondary">Close</button>
            </div>
        `;
    }

    // Transactions Management
    loadAllTransactions() {
        const transactionsList = document.getElementById('allTransactionsList');
        const transactions = blockchain.transactions.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="no-data">No transactions found</div>';
            return;
        }

        transactionsList.innerHTML = transactions.map(tx => {
            const isFee = tx.type === 'fee';
            const isAdmin = tx.type === 'admin_deduction';
            const borderColor = isFee ? '#ed8936' : (isAdmin ? '#e53e3e' : '#4299e1');
            
            return `
                <div class="transaction-item" style="border-left-color: ${borderColor}">
                    <div class="transaction-info">
                        <div><strong>${tx.id}</strong></div>
                        <div>From: ${tx.from} → To: ${tx.to}</div>
                        <div>Type: ${tx.type} | ${new Date(tx.timestamp).toLocaleString()}</div>
                        ${tx.reason ? `<div><small><strong>Reason:</strong> ${tx.reason}</small></div>` : ''}
                    </div>
                    <div class="transaction-amount">
                        ${tx.amount.toFixed(2)} USD
                        ${tx.fee ? `<br><small>Fee: ${tx.fee.toFixed(2)} USD</small>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // System Controls
    runSecurityScan() {
        const results = enhancedSecurity.securityScan();
        this.showNotification(
            `Security scan completed. Found ${results.issues.length} issues.`,
            'success'
        );
        this.updateSystemStatus();
    }

    emergencyUnlockAll() {
        const count = enhancedSecurity.emergencyUnlockAll();
        this.showNotification(
            `Emergency unlock: ${count} accounts unlocked`,
            'success'
        );
        this.updateSystemStatus();
    }

    clearAllData() {
        if (confirm('⚠️ ARE YOU SURE? This will delete ALL data including users and transactions!')) {
            localStorage.clear();
            location.reload();
        }
    }

    closeModal() {
        document.getElementById('userActionModal').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            z-index: 10001;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#4299e1'};
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    
    
// Add to AdminPanel class
broadcastToUsers() {
    const message = prompt('Enter message to broadcast to all users:');
    if (message && confirm(`Send this message to all users?\n\n"${message}"`)) {
        // This would integrate with the chat system
        alert('Broadcast feature would send this to all active users');
        // In full implementation: adminChat.broadcastMessage(message);
    }
}
    
    
    
}
// Global admin instance
const admin = new AdminPanel();
// Global functions for HTML
function adminLogin() { admin.login(); }
function adminLogout() { admin.logout(); }
function showSection(section) { admin.showSection(section); }
function searchUsers() { admin.searchUsers(); }
function closeModal() { admin.closeModal(); }
function runSecurityScan() { admin.runSecurityScan(); }
function emergencyUnlockAll() { admin.emergencyUnlockAll(); }
function clearAllData() { admin.clearAllData(); }