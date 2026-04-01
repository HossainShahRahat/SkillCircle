import { repository } from '../models/repository.js';

export function requireCircleRole(roles) {
  return async (req, _res, next) => {
    try {
      const role = await repository.getCircleRole(req.params.circleId, req.user?.id);
      if (!role || !roles.includes(role)) {
        const error = new Error('You do not have permission to perform this action.');
        error.status = 403;
        throw error;
      }
      req.circleRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
}
