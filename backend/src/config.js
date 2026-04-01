import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  clientUrls: (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'skillcircle-dev-secret',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  storageMode: process.env.STORAGE_MODE || 'simulated',
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || 'https://cdn.skillcircle.local',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const isSupabaseConfigured = Boolean(
  config.supabaseUrl && config.supabaseServiceRoleKey,
);
