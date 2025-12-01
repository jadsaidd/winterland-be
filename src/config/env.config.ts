import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;

  // JWT
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRATION: number;
  JWT_REFRESH_EXPIRATION: number;

  // Database
  DATABASE_URL: string;

  // Security
  PASSWORD_SALT_ROUNDS: number;
  MAX_LOGIN_ATTEMPTS: number;
  ACCOUNT_LOCK_TIME: number;

  // Logging
  LOG_LEVEL: string;

  // Wallet
  DEFAULT_CURRENCY: string;

  // Client URLs
  CLIENT_SESSION_URL: string;

  // Email Service
  RESEND_API_KEY: string;
}

// Required environment variables
const requiredEnvVars = [
  'PORT',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL'
];

// Check for missing environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRATION: parseInt(process.env.JWT_ACCESS_EXPIRATION || '3600', 10),
  JWT_REFRESH_EXPIRATION: parseInt(process.env.JWT_REFRESH_EXPIRATION || '2592000', 10),

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // Security
  PASSWORD_SALT_ROUNDS: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10),
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  ACCOUNT_LOCK_TIME: parseInt(process.env.ACCOUNT_LOCK_TIME || '1800', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Wallet
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || 'AED',

  // Client URLs
  CLIENT_SESSION_URL: process.env.CLIENT_SESSION_URL || 'https://winterland.ae/seats',

  // Email Service
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
};

export default config;
