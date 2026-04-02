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
  bodyLimit: process.env.BODY_LIMIT || '15mb',
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || 'https://cdn.skillcircle.local',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:4000',
  forceHttps: process.env.FORCE_HTTPS === 'true',
  nodeEnv: process.env.NODE_ENV || 'development',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
};

export const isSupabaseConfigured = Boolean(
  config.supabaseUrl && config.supabaseServiceRoleKey,
);

if (config.nodeEnv === 'production' && config.jwtSecret === 'skillcircle-dev-secret') {
  throw new Error('JWT_SECRET must be configured in production.');
}
