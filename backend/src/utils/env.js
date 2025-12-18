/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are set before the app starts
 */

const isProduction = process.env.NODE_ENV === 'production';

// In production, these are required. In development, defaults are provided.
const requiredInProduction = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET',
];

const optionalEnvVars = {
  PORT: 4000,
  NODE_ENV: 'development',
  DB_HOST: 'localhost',
  DB_PORT: 3306,
  DB_NAME: 'cems',
  DB_USER: 'root',
  DB_PASS: '', // Can be empty for local development
  DB_PASSWORD: '', // Alternative name, will use DB_PASS if set
  JWT_SECRET: isProduction ? undefined : 'change_me_dev_secret_key',
  JWT_REFRESH_SECRET: isProduction ? undefined : undefined, // Will fallback to JWT_SECRET if not set
  JWT_EXPIRES_IN: '24h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  ALLOWED_ORIGINS: '*',
};

const validateEnv = () => {
  // Set defaults for optional variables first
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key] && defaultValue !== undefined) {
      process.env[key] = defaultValue;
    }
  });
  
  // Handle DB_PASSWORD vs DB_PASS (support both)
  if (!process.env.DB_PASS && process.env.DB_PASSWORD) {
    process.env.DB_PASS = process.env.DB_PASSWORD;
  }
  if (!process.env.DB_PASSWORD && process.env.DB_PASS) {
    process.env.DB_PASSWORD = process.env.DB_PASS;
  }
  
  // Handle JWT_REFRESH_SECRET fallback (after defaults are set)
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'change_me_dev_secret_key_refresh') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'change_me_dev_secret_key') {
      process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET + '_refresh';
    } else {
      process.env.JWT_REFRESH_SECRET = 'change_me_dev_secret_key_refresh';
    }
  }
  
  // In production, validate required variables
  if (isProduction) {
    const missing = [];
    
    requiredInProduction.forEach((varName) => {
      if (!process.env[varName] || process.env[varName].trim() === '') {
        missing.push(varName);
      }
    });
    
    // Also check DB_PASS or DB_PASSWORD in production
    if (!process.env.DB_PASS && !process.env.DB_PASSWORD) {
      missing.push('DB_PASS or DB_PASSWORD');
    }
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables for production:');
      missing.forEach((varName) => {
        console.error(`   - ${varName}`);
      });
      console.error('\nPlease set these variables in your .env file or environment.');
      process.exit(1);
    }
  } else {
    // In development, warn about missing important variables but don't fail
    const warnings = [];
    
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me_dev_secret_key') {
      warnings.push('⚠️  JWT_SECRET is using default value. Set a secure secret for production.');
    }
    
    if (!process.env.DB_PASS && !process.env.DB_PASSWORD) {
      warnings.push('⚠️  DB_PASS/DB_PASSWORD not set. Using empty password (may fail if DB requires password).');
    }
    
    if (warnings.length > 0) {
      warnings.forEach(warning => console.warn(warning));
    }
  }
  
  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(process.env.NODE_ENV)) {
    console.warn(`⚠️  NODE_ENV should be one of: ${validEnvs.join(', ')}. Defaulting to 'development'.`);
    process.env.NODE_ENV = 'development';
  }
  
  console.log('✅ Environment variables validated');
};

module.exports = { validateEnv };

