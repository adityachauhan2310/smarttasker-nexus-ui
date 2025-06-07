import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Default environment values
const env = process.env.NODE_ENV || 'development';
const port = parseInt(process.env.PORT || '5000', 10);
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/smarttasker?authSource=admin';
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_me';
const jwtExpire = process.env.JWT_EXPIRE || '1d';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me';
const jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';
const cookieSecret = process.env.COOKIE_SECRET || 'your_cookie_secret_key_change_me';
const bcryptSaltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || String(5 * 1024 * 1024), 10); // 5MB default

// Redis configuration
const enableRedis = process.env.ENABLE_REDIS === 'true';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Email configuration
const email = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  fromAddress: process.env.EMAIL_FROM || 'noreply@smarttasker.com',
  disabled: process.env.EMAIL_DISABLED === 'true',
  sendInDevelopment: process.env.EMAIL_SEND_IN_DEV === 'true',
};

// Rate limiting
const rateLimit = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes in milliseconds
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per window
};

// Allowed Origins for CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:8080')
  .split(',')
  .map(origin => origin.trim());

// Groq AI configuration
const groqAi = {
  apiKey: process.env.GROQ_API_KEY || '',
  apiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1',
  model: process.env.GROQ_MODEL || 'llama3-8b-8192', // Default model
  maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '4096', 10),
  temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7'),
  topP: parseFloat(process.env.GROQ_TOP_P || '0.9'),
  streaming: process.env.GROQ_STREAMING === 'true',
  retries: parseInt(process.env.GROQ_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.GROQ_RETRY_DELAY_MS || '1000', 10),
  timeoutMs: parseInt(process.env.GROQ_TIMEOUT_MS || '60000', 10), // 60 seconds default
  rateLimit: {
    windowMs: parseInt(process.env.GROQ_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    max: parseInt(process.env.GROQ_RATE_LIMIT_MAX || '20', 10), // 20 requests per minute
  },
  systemPrompt: process.env.GROQ_SYSTEM_PROMPT || 'You are SmartTasker AI, an intelligent assistant for task management.',
};

const config = {
  env,
  port,
  mongoUri,
  jwtSecret,
  jwtExpire,
  jwtRefreshSecret,
  jwtRefreshExpire,
  cookieSecret,
  bcryptSaltRounds,
  uploadsDir,
  maxFileSize,
  enableRedis,
  redisUrl,
  email,
  rateLimit,
  allowedOrigins,
  groqAi,
  isDev: env === 'development',
  isProd: env === 'production',
};

export default config; 