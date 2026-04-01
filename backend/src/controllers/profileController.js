import { repository } from '../models/repository.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function getProfile(req, res) {
  res.json({ user: req.user });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, bio, avatar_url, skills } = req.body;
    if (!name?.trim()) {
      throw badRequest('Name is required.');
    }

    const user = await repository.updateProfile(req.user.id, {
      name: name.trim(),
      bio: bio?.trim() || '',
      avatar_url: avatar_url?.trim() || '',
      skills: Array.isArray(skills) ? skills.filter(Boolean) : [],
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

