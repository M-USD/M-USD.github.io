
const CONFIG = {
  ENV: 'production',
  API_URL: 'https://api.m-usd.com',
  BLOCKCHAIN: {
    FEE_PERCENT: 0.01,
    MIN_FEE: 0.01,
    FEE_COLLECTOR: '+254746500025'
  },
  SECURITY: {
    SESSION_TIMEOUT: 30 * 60 * 1000,
    MAX_LOGIN_ATTEMPTS: 5,
    PASSWORD_MIN_LENGTH: 8,
    LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minutes

  },
  COMPLIANCE: {
    DAILY_LIMIT: 1000000,
    TRANSACTION_LIMIT: 50000,
    ENABLED: true,
    AUTO_REPORTING: true,
    SANCTIONS_CHECK: true
  }
};


