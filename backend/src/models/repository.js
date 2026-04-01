import { isSupabaseConfigured } from '../config.js';
import { createMemoryRepository } from './memoryRepository.js';
import { createSupabaseRepository } from './supabaseRepository.js';

export const repository = isSupabaseConfigured
  ? createSupabaseRepository()
  : createMemoryRepository();

