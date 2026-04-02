import { config } from '../config.js';
import { logger } from './logger.js';
import crypto from 'crypto';

function cloudinaryConfigured() {
  return Boolean(
    config.cloudinaryCloudName
      && config.cloudinaryApiKey
      && config.cloudinaryApiSecret,
  );
}

async function uploadToCloudinary({ dataUrl, fileName, contentType }) {
  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/auto/upload`;
  const body = new URLSearchParams();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'skillcircle/chat';
  const publicId = `${Date.now().toString(36)}-${(fileName || 'upload').replace(/\.[^.]+$/, '')}`;
  body.set('file', dataUrl);
  body.set('api_key', config.cloudinaryApiKey);
  body.set('timestamp', String(timestamp));
  if (config.cloudinaryUploadPreset) {
    body.set('upload_preset', config.cloudinaryUploadPreset);
  }
  body.set('folder', folder);
  body.set('public_id', publicId);
  body.set('resource_type', 'auto');

  if (!config.cloudinaryUploadPreset) {
    const signatureBase = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${config.cloudinaryApiSecret}`;
    body.set('signature', crypto.createHash('sha1').update(signatureBase).digest('hex'));
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.warn('Cloudinary upload failed', { status: response.status, errorBody });
    throw new Error('Unable to upload media.');
  }

  const payload = await response.json();
  return {
    url: payload.secure_url,
    thumbnailUrl: payload.secure_url,
    type: contentType || payload.resource_type || 'application/octet-stream',
  };
}

export async function createImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('http')) return image;

  const slug = Date.now().toString(36);

  if (config.storageMode === 'simulated') {
    return `${config.r2PublicBaseUrl}/simulated/${slug}.jpg`;
  }

  return `${config.r2PublicBaseUrl}/${slug}.jpg`;
}

export async function createChatMediaAttachment({
  fileName,
  contentType,
  size = 0,
  dataUrl,
  sourceUrl,
}) {
  const normalizedName = fileName || `upload-${Date.now()}`;
  const normalizedType = contentType || 'application/octet-stream';
  const extension = normalizedName.includes('.') ? normalizedName.split('.').pop() : 'bin';

  if (sourceUrl?.startsWith('http')) {
    return {
      url: sourceUrl,
      type: normalizedType,
      name: normalizedName,
      size,
      thumbnail_url: sourceUrl,
    };
  }

  if ((config.storageMode === 'cloudinary' || cloudinaryConfigured()) && dataUrl) {
    const uploaded = await uploadToCloudinary({
      dataUrl,
      fileName: normalizedName,
      contentType: normalizedType,
    });
    return {
      url: uploaded.url,
      type: normalizedType,
      name: normalizedName,
      size,
      thumbnail_url: uploaded.thumbnailUrl,
    };
  }

  if (config.storageMode === 'simulated') {
    return {
      url: dataUrl || `${config.r2PublicBaseUrl}/simulated/${Date.now().toString(36)}.${extension}`,
      type: normalizedType,
      name: normalizedName,
      size,
      thumbnail_url: dataUrl || `${config.r2PublicBaseUrl}/simulated/${Date.now().toString(36)}.${extension}`,
    };
  }

  return {
    url: `${config.r2PublicBaseUrl}/${Date.now().toString(36)}.${extension}`,
    type: normalizedType,
    name: normalizedName,
    size,
    thumbnail_url: `${config.r2PublicBaseUrl}/${Date.now().toString(36)}.${extension}`,
  };
}
