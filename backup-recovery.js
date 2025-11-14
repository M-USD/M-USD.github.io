// Backup and Disaster Recovery System - FIXED
class BackupSystem {
  constructor() {
    this.backupInterval = 4 * 60 * 60 * 1000; // 4 hours
    this.maxBackups = 168; // 1 week of hourly backups
    this.startBackupSchedule();
  }
  
// Add automatic backup triggers
setupBackupTriggers() {
  // Backup before any critical operation
  const criticalMethods = ['sendMoney', 'addFunds', 'registerUser'];
  
  criticalMethods.forEach(method => {
    const original = blockchain[method];
    blockchain[method] = function(...args) {
      backupSystem.createBackup();
      return original.apply(this, args);
    };
  });
}

// Add export/import functionality
exportUserData(phoneNumber) {
  const user = blockchain.users.get(phoneNumber);
  const transactions = blockchain.getUserTransactions(phoneNumber);
  
  return {
    user: {
      phoneNumber: user.phoneNumber,
      walletAddress: user.walletAddress,
      balance: user.balance,
      createdAt: user.createdAt
    },
    transactions,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
}
  
  
  startBackupSchedule() {
    // Regular backups
    setInterval(() => this.createBackup(), this.backupInterval);
    
    // Backup before critical operations
    this.monitorCriticalOperations();
  }
  
  createBackup() {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        data: {
          users: Array.from(blockchain.users.entries()),
          transactions: blockchain.transactions,
          blockHeight: blockchain.blockHeight,
          systemState: this.getSystemState()
        },
        checksum: this.generateChecksum(),
        version: '2.0.0'
      };
      
      this.saveBackup(backup);
      this.cleanupOldBackups();
      
      console.log('✅Backup created successfully');
      return backup;
    } catch (error) {
      console.error('📵Backup failed:', error);
      this.alertBackupFailure(error);
    }
  }
  
  saveBackup(backup) {
    const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
    backups.push(backup);
    localStorage.setItem('system_backups', JSON.stringify(backups));
  }
  
  cleanupOldBackups() {
    const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
    if (backups.length > this.maxBackups) {
      const recentBackups = backups.slice(-this.maxBackups);
      localStorage.setItem('system_backups', JSON.stringify(recentBackups));
    }
  }
  
  restoreBackup(backupTimestamp) {
    const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
    const backup = backups.find(b => b.timestamp === backupTimestamp);
    
    if (!backup) {
      throw new Error('📵Backup not found');
    }
    
    if (!this.verifyBackup(backup)) {
      throw new Error('📵Backup verification failed');
    }
    
    // Restore data
    blockchain.users = new Map(backup.data.users);
    blockchain.transactions = backup.data.transactions;
    blockchain.blockHeight = backup.data.blockHeight;
    
    blockchain.saveToStorage();
    
    return true;
  }
  
  verifyBackup(backup) {
    return backup.checksum === this.generateChecksum(backup.data);
  }
  
  generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  getSystemState() {
    return {
      totalUsers: blockchain.users.size,
      totalTransactions: blockchain.transactions.length,
      totalValue: Array.from(blockchain.users.values()).reduce((sum, user) =>
        sum + (parseFloat(user.balance) || 0), 0
      ),
      timestamp: new Date().toISOString()
    };
  }
  
  monitorCriticalOperations() {
    // Backup will be created by individual operations as needed
    console.log('✅Backup system monitoring started');
  }
  
  alertBackupFailure(error) {
    // Notify administrators
    if (typeof notificationSystem !== 'undefined') {
      notificationSystem.addNotification({
        type: 'SYSTEM_ALERT',
        title: 'Backup Failed',
        message: `📵Automatic backup failed: ${error.message}`,
        priority: 'high',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Export/Import for migration
  exportData() {
    const data = {
      users: Array.from(blockchain.users.entries()),
      transactions: blockchain.transactions,
      system: this.getSystemState(),
      exportTime: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  importData(jsonData) {
    const data = JSON.parse(jsonData);
    
    // Validate data structure
    if (!data.users || !data.transactions) {
      throw new Error('Invalid data format');
    }
    
    // Create backup before import
    this.createBackup();
    
    // Import data
    blockchain.users = new Map(data.users);
    blockchain.transactions = data.transactions;
    blockchain.saveToStorage();
    
    return true;
  }
}

const backupSystem = new BackupSystem();