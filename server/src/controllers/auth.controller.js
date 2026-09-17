import * as authService from '../services/auth.service.js';

export async function signup(req, res) {
  const { user, token, apiKey } = await authService.signup(req.body);
  res.status(201).json({ user, token, apiKey });
}

export async function login(req, res) {
  const { user, token } = await authService.login(req.body);
  res.json({ user, token });
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function regenerateApiKey(req, res) {
  const { user, apiKey } = await authService.regenerateApiKey(req.user._id);
  res.json({ user, apiKey });
}
