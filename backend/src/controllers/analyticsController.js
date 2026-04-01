import { repository } from '../models/repository.js';

export async function getUserAnalytics(req, res, next) {
  try {
    const analytics = await repository.getUserAnalytics(req.user.id);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

export async function getCircleAnalytics(req, res, next) {
  try {
    const analytics = await repository.getCircleAnalytics(req.params.circleId, req.user.id);
    if (!analytics) {
      return res.status(404).json({ message: 'Circle analytics not available.' });
    }

    res.json(analytics);
  } catch (error) {
    next(error);
  }
}
