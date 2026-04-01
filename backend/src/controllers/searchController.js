import { repository } from '../models/repository.js';

export async function search(req, res, next) {
  try {
    const query = req.query.q?.trim() || '';
    if (!query) {
      return res.json({ users: [], circles: [] });
    }

    const results = await repository.search(query, req.user?.id || null);
    res.json(results);
  } catch (error) {
    next(error);
  }
}

