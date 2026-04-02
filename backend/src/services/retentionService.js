import { repository } from '../models/repository.js';

export async function getRetentionOverview(userId) {
  return repository.getRetentionOverview(userId);
}

export async function createGoal(userId, payload) {
  return repository.createGoal(userId, payload);
}

export async function updateGoal(userId, goalId, payload) {
  return repository.updateGoal(userId, goalId, payload);
}

export async function deleteGoal(userId, goalId) {
  return repository.deleteGoal(userId, goalId);
}

export async function upsertSkillProgress(userId, payload) {
  return repository.upsertSkillProgress(userId, payload);
}
