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

