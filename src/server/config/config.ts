import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  jwtSecret: string;
  jwtExpire: string;
  bcryptSaltRounds: number;
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  supabaseUrl: process.env.SUPABASE_URL || 'https://syoqzjwyvegytdxfchil.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5b3F6and5dmVneXRkeGZjaGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTE3NjIsImV4cCI6MjA2NTY2Nzc2Mn0.2Eon5-2nwTEarvnHG0b8Vr1_hJhdwAA8g7Fk-ZLkloI',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5b3F6and5dmVneXRkeGZjaGlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA5MTc2MiwiZXhwIjoyMDY1NjY3NzYyfQ.OTAu376lnIVwduExzw-kgftMRN0Cw2FTGa5eWsni04o',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
};

console.log('Config loaded:');
console.log('- Node Environment:', config.nodeEnv);
console.log('- Port:', config.port);
console.log('- Supabase URL:', config.supabaseUrl);

export default config;
