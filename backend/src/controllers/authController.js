import { comparePassword, createToken, hashPassword } from '../services/authService.js';
import { repository } from '../models/repository.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw badRequest('Name, email, and password are required.');
    }

    const existing = await repository.findUserWithPasswordByEmail(email);
    if (existing) {
      throw badRequest('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);
    const user = await repository.createUser({ name, email, passwordHash });
    const token = createToken(user.id);

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw badRequest('Email and password are required.');
    }

    const user = await repository.findUserWithPasswordByEmail(email);
    if (!user) {
      throw badRequest('Invalid credentials.');
    }

    const matches = await comparePassword(password, user.password_hash);
    if (!matches) {
      throw badRequest('Invalid credentials.');
    }

    const token = createToken(user.id);
    const safeUser = await repository.findUserById(user.id);
    res.json({ token, user: safeUser });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

