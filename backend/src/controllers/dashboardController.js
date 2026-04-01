import { repository } from '../models/repository.js';

export async function getDashboard(req, res, next) {
  try {
    const dashboard = await repository.getDashboard(req.user.id);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}
