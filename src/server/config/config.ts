
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  mongoURI: string;
  jwtSecret: string;
  jwtExpire: string;
  jwtRefreshSecret: string;
  jwtRefreshExpire: string;
  bcryptSaltRounds: number;
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/smarttasker',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
};

// Validate required environment variables
if (!config.mongoURI) {
  throw new Error('MONGO_URI environment variable is required');
}

console.log('Config loaded:');
console.log('- Node Environment:', config.nodeEnv);
console.log('- Port:', config.port);
console.log('- MongoDB URI:', config.mongoURI);
console.log('- JWT Secret length:', config.jwtSecret.length);

export default config;
