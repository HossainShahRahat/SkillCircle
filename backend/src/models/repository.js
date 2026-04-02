import { useSupabaseRepository } from '../config.js';
import { createMemoryRepository } from './memoryRepository.js';
import { createSupabaseRepository } from './supabaseRepository.js';

export const repository = useSupabaseRepository
  ? createSupabaseRepository()
  : createMemoryRepository();
