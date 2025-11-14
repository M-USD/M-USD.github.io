// Database and Storage Management - FINAL CORRECTED VERSION
class Database {
    constructor() {
        this.STORAGE_KEYS = {
            USERS: 'phonechain_users',
            TRANSACTIONS: 'phonechain_transactions',
            SETTINGS: 'phonechain_settings',
            SESSION: 'phonechain_session'
        };
    }
    
    // User management
    saveUser(user) {
        try {
            const users = this.getAllUsers();
            users[user.phoneNumber] = user;
            localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Failed to save user:', error);
            return false;
        }
    }
    
    getUser(phoneNumber) {
        try {
            const users = this.getAllUsers();
            return users[phoneNumber] || null;
        } catch (error) {
            console.error('Failed to get user:', error);
            return null;
        }
    }
    
    getAllUsers() {
        try {
            const users = localStorage.getItem(this.STORAGE_KEYS.USERS);
            return users ? JSON.parse(users) : {};
        } catch (error) {
            console.error('Failed to get users:', error);
            return {};
        }
    }
    
    // Session management
    saveSession(sessionData) {
        try {
            const safeSession = {
                phoneNumber: sessionData.phoneNumber,
                walletAddress: sessionData.walletAddress,
                loginTime: sessionData.loginTime,
                lastActivity: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(safeSession));
            return true;
        } catch (error) {
            console.error('Failed to save session:', error);
            return false;
        }
    }
    
    getSession() {
        try {
            const session = localStorage.getItem(this.STORAGE_KEYS.SESSION);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Failed to get session:', error);
            return null;
        }
    }
    
    clearSession() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.SESSION);
            return true;
        } catch (error) {
            console.error('Failed to clear session:', error);
            return false;
        }
    }
}

// Global database instance
const database = new Database();