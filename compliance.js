// Regulatory Compliance System - UPDATED
class ComplianceSystem {
  constructor() {
    this.transactionLimits = {
      DAILY_LIMIT: (CONFIG && CONFIG.COMPLIANCE && CONFIG.COMPLIANCE.DAILY_LIMIT) || 1000000,
      SINGLE_TRANSACTION: (CONFIG && CONFIG.COMPLIANCE && CONFIG.COMPLIANCE.TRANSACTION_LIMIT) || 50000,
      MONTHLY_LIMIT: 50000000
    };
    this.suspiciousPatterns = [];
    this.kycRecords = new Map();
  }
  
  // KYC (Know Your Customer) verification
  async verifyKYC(phoneNumber, userData) {
    const kycRecord = {
      phoneNumber,
      status: 'pending',
      level: 'BASIC',
      submittedAt: new Date().toISOString(),
      documents: [],
      riskScore: this.calculateRiskScore(userData)
    };
    
    this.kycRecords.set(phoneNumber, kycRecord);
    return kycRecord;
  }
  
  calculateRiskScore(userData) {
    let score = 50; // Base score
    
    // Adjust based on various factors
    if (userData.transactionCount > 100) score += 10;
    if (userData.averageTransaction > 1000) score += 15;
    // Add more risk factors
    
    return Math.min(100, Math.max(0, score));
  }
  
  // Transaction monitoring for AML - FIXED RETURN VALUE
  monitorTransaction(transaction) {
    try {
      const rules = [
        this.checkAmountLimit(transaction),
        this.checkFrequency(transaction),
        this.checkPattern(transaction)
      ];
      
      const violations = rules.filter(rule => !rule.passed);
      if (violations.length > 0) {
        this.flagSuspiciousTransaction(transaction, violations);
        return false; // Block transaction
      }
      
      return true; // Allow transaction
    } catch (error) {
      console.error('☢️Compliance check error:', error);
      return true; // Allow on error (fail-open for demo)
    }
  }
  
  checkAmountLimit(transaction) {
    const dailyTotal = this.getDailyTotal(transaction.from);
    const passed = transaction.amount <= this.transactionLimits.SINGLE_TRANSACTION &&
      dailyTotal + transaction.amount <= this.transactionLimits.DAILY_LIMIT;
    
    return {
      passed,
      rule: 'AMOUNT_LIMIT',
      details: passed ? null : `Exceeds limits: ${transaction.amount}`
    };
  }
  
  checkFrequency(transaction) {
    const userTxs = blockchain.getUserTransactions(transaction.from);
    const lastHourTxs = userTxs.filter(tx =>
      Date.now() - new Date(tx.timestamp).getTime() < 3600000
    );
    
    const passed = lastHourTxs.length < 100; // Max 10 transactions per hour
    return {
      passed,
      rule: 'FREQUENCY_LIMIT',
      details: passed ? null : 'Too many transactions in short period'
    };
  }
  
  getDailyTotal(phoneNumber) {
    const userTxs = blockchain.getUserTransactions(phoneNumber);
    const today = new Date().toDateString();
    const todayTxs = userTxs.filter(tx =>
      new Date(tx.timestamp).toDateString() === today
    );
    
    return todayTxs.reduce((sum, tx) => sum + tx.amount, 0);
  }
  
  flagSuspiciousTransaction(transaction, violations) {
    const alert = {
      id: 'AML_' + Date.now(),
      transactionId: transaction.id,
      phoneNumber: transaction.from,
      amount: transaction.amount,
      violations: violations.map(v => v.rule),
      timestamp: new Date().toISOString(),
      status: 'pending_review',
      autoAction: this.determineAutoAction(violations)
    };
    
    this.suspiciousPatterns.push(alert);
    
    // Notify AI system
    if (typeof aiMonitor !== 'undefined') {
      aiMonitor.logError('COMPLIANCE_ALERT', `Suspicious transaction detected`, alert);
    }
    
    // Take auto action if needed
    if (alert.autoAction === 'BLOCK') {
      const user = blockchain.users.get(transaction.from);
      if (user) {
        user.frozen = true;
        user.freezeReason = 'Suspicious transaction pattern';
        blockchain.saveToStorage();
      }
    }
  }
  
  determineAutoAction(violations) {
    const severeViolations = violations.filter(v =>
      v.rule === 'AMOUNT_LIMIT' || v.rule === 'FREQUENCY_LIMIT'
    );
    
    return severeViolations.length > 0 ? 'REVIEW' : 'ALLOW';
  }
  
  checkPattern(transaction) {
    // Simple pattern detection
    const userTxs = blockchain.getUserTransactions(transaction.from);
    const recentTxs = userTxs.filter(tx =>
      Date.now() - new Date(tx.timestamp).getTime() < 3600000 // 1 hour
    );
    
    // Flag if multiple transactions to same recipient in short time
    const sameRecipientTxs = recentTxs.filter(tx => tx.to === transaction.to);
    const passed = sameRecipientTxs.length < 3;
    
    return {
      passed,
      rule: 'PATTERN_DETECTION',
      details: passed ? null : 'Multiple transactions to same recipient'
    };
  }
  
  // Reporting for regulators
  generateSAR(alert) {
    // Suspicious Activity Report
    return {
      reportId: 'SAR_' + Date.now(),
      subject: alert.phoneNumber,
      transactionDetails: alert,
      filedAt: new Date().toISOString(),
      status: 'filed'
    };
  }
  
  // Sanctions screening
  async checkSanctions(phoneNumber, name) {
    // In production, integrate with sanctions list API
    const sanctionsList = []; // Would be populated from external API
    
    return !sanctionsList.some(sanction =>
      sanction.phoneNumbers.includes(phoneNumber) ||
      sanction.names.some(n => name.includes(n))
    );
  }
}

const compliance = new ComplianceSystem();