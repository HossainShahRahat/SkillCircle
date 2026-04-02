import {
  createGoal,
  deleteGoal,
  getRetentionOverview,
  updateGoal,
  upsertSkillProgress,
} from '../services/retentionService.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function normalizeGoalPayload(body) {
  const targetValue = Number(body.targetValue);
  const currentValue = body.currentValue === undefined ? 0 : Number(body.currentValue);

  if (!body.title?.trim()) {
    throw badRequest('Goal title is required.');
  }
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    throw badRequest('Goal targetValue must be greater than zero.');
  }
  if (!Number.isFinite(currentValue) || currentValue < 0) {
    throw badRequest('Goal currentValue must be zero or more.');
  }

  return {
    title: body.title.trim(),
    description: body.description?.trim() || '',
    targetValue,
    currentValue,
    unit: body.unit?.trim() || 'sessions',
    cadence: body.cadence?.trim() || 'weekly',
    dueDate: body.dueDate || null,
    status: body.status,
  };
}

function normalizeSkillProgressPayload(body) {
  const progressPercent = Number(body.progressPercent);
  if (!body.skillName?.trim()) {
    throw badRequest('skillName is required.');
  }
  if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    throw badRequest('progressPercent must be between 0 and 100.');
  }

  return {
    skillName: body.skillName.trim(),
    progressPercent,
    currentLevel: body.currentLevel?.trim() || '',
    targetLevel: body.targetLevel?.trim() || '',
    notes: body.notes?.trim() || '',
  };
}

export async function getRetention(req, res, next) {
  try {
    const retention = await getRetentionOverview(req.user.id);
    res.json(retention);
  } catch (error) {
    next(error);
  }
}

export async function createRetentionGoal(req, res, next) {
  try {
    const goal = await createGoal(req.user.id, normalizeGoalPayload(req.body));
    const retention = await getRetentionOverview(req.user.id);
    res.status(201).json({ goal, retention });
  } catch (error) {
    next(error);
  }
}

export async function updateRetentionGoal(req, res, next) {
  try {
    const goal = await updateGoal(req.user.id, req.params.goalId, normalizeGoalPayload(req.body));
    const retention = await getRetentionOverview(req.user.id);
    res.json({ goal, retention });
  } catch (error) {
    next(error);
  }
}

export async function deleteRetentionGoal(req, res, next) {
  try {
    await deleteGoal(req.user.id, req.params.goalId);
    const retention = await getRetentionOverview(req.user.id);
    res.json({ deleted: true, retention });
  } catch (error) {
    next(error);
  }
}

export async function saveSkillProgress(req, res, next) {
  try {
    const skillProgress = await upsertSkillProgress(req.user.id, normalizeSkillProgressPayload(req.body));
    const retention = await getRetentionOverview(req.user.id);
    res.json({ skillProgress, retention });
  } catch (error) {
    next(error);
  }
}
