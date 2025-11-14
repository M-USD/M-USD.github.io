// Advanced Admin Authentication System - FIXED (No CryptoJS)
class AdminAuth {
  constructor() {
    this.admins = new Map();
    this.sessions = new Map();
    this.failedAttempts = new Map();
    this.setupDefaultAdmin();
  }
  
  setupDefaultAdmin() {
    const defaultAdmin = {
      id: 'admin001',
      username: 'superadmin',
      passwordHash: this.hashPassword('admin2024'),
      role: 'super_admin',
      permissions: ['ALL'],
      twoFactorEnabled: false,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    this.admins.set('superadmin', defaultAdmin);
  }
  
  hashPassword(password) {
    // Simple hash without CryptoJS dependency
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'admin_' + Math.abs(hash).toString(16);
  }
  
  async login(username, password, twoFactorCode = null) {
    // Rate limiting
    if (this.isRateLimited(username)) {
      throw new Error('Too many failed attempts. Try again in 15 minutes');
    }
    
    const admin = this.admins.get(username);
    if (!admin || !admin.isActive) {
      this.recordFailedAttempt(username);
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    if (this.hashPassword(password) !== admin.passwordHash) {
      this.recordFailedAttempt(username);
      throw new Error('Invalid credentials');
    }
    
    // Two-factor authentication
    if (admin.twoFactorEnabled && !this.verifyTwoFactor(twoFactorCode)) {
      throw new Error('Invalid two-factor code');
    }
    
    // Create session
    const sessionToken = this.generateSessionToken();
    const session = {
      token: sessionToken,
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions,
      loginTime: new Date().toISOString(),
      lastActivity: Date.now(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };
    
    this.sessions.set(sessionToken, session);
    admin.lastLogin = new Date().toISOString();
    
    // Clear failed attempts
    this.failedAttempts.delete(username);
    
    return session;
  }
  
  verifySession(token) {
    const session = this.sessions.get(token);
    if (!session) return false;
    
    // Check session expiration (8 hours)
    if (Date.now() - session.lastActivity > 8 * 60 * 60 * 1000) {
      this.sessions.delete(token);
      return false;
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    return session;
  }
  
  logout(token) {
    this.sessions.delete(token);
  }
  
  isRateLimited(username) {
    const attempts = this.failedAttempts.get(username) || [];
    const recentAttempts = attempts.filter(time =>
      Date.now() - time < 15 * 60 * 1000 // 15 minutes
    );
    return recentAttempts.length >= 5;
  }
  
  recordFailedAttempt(username) {
    const attempts = this.failedAttempts.get(username) || [];
    attempts.push(Date.now());
    this.failedAttempts.set(username, attempts);
  }
  
  generateSessionToken() {
    return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
  }
  
  getClientIP() {
    // In production, get from headers
    return 'unknown';
  }
  
  verifyTwoFactor(code) {
    // Implement TOTP verification
    return true; // Placeholder
  }
  
  // Permission checking
  hasPermission(session, permission) {
    if (session.permissions.includes('ALL')) return true;
    return session.permissions.includes(permission);
  }
  
  // Audit logging
  logAdminAction(session, action, details) {
    const logEntry = {
      adminId: session.adminId,
      username: session.username,
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: session.ipAddress
    };
    
    // Save to localStorage (in production, send to server)
    const logs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('admin_audit_logs', JSON.stringify(logs.slice(-1000))); // Keep last 1000
  }
}

const adminAuth = new AdminAuth();