import { config } from '../config.js';

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
    };
  }

  if (config.storageMode === 'simulated') {
    return {
      url: dataUrl || `${config.r2PublicBaseUrl}/simulated/${Date.now().toString(36)}.${extension}`,
      type: normalizedType,
      name: normalizedName,
      size,
    };
  }

  return {
    url: `${config.r2PublicBaseUrl}/${Date.now().toString(36)}.${extension}`,
    type: normalizedType,
    name: normalizedName,
    size,
  };
}
