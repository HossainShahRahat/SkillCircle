import { repository } from '../models/repository.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function getProfile(req, res, next) {
  try {
    const profile = await repository.getProfile(req.user.id, req.user.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
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

export async function getPublicProfile(req, res, next) {
  try {
    const profile = await repository.getProfile(req.params.userId, req.user?.id || null);
    if (!profile) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
}
