import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';

const buildAuthResponse = (user, token) => ({
  token,
  user: {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    organization: user.organization,
    address: user.address
  }
});

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { name, email, password, phone, organization, address } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    organization,
    address,
    role: 'customer',
    lastLoginAt: new Date()
  });

  const token = signToken({ id: user._id, role: user.role, email: user.email });

  res.status(201).json(buildAuthResponse(user, token));
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id, role: user.role, email: user.email });

  res.status(200).json(buildAuthResponse(user, token));
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.status(200).json({ user });
};

export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { name, email, phone, organization, address, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(409).json({ message: 'This email is already in use.' });
    }
    user.email = email;
  }

  if (typeof name === 'string') {
    user.name = name;
  }

  if (typeof phone === 'string' || phone === null) {
    user.phone = phone;
  }

  if (typeof organization === 'string' || organization === null) {
    user.organization = organization;
  }

  if (typeof address === 'string' || address === null) {
    user.address = address;
  }

  if (newPassword) {
    if (!currentPassword) {
      return res.status(422).json({ message: 'Current password is required to set a new password.' });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
  }

  await user.save();

  const sanitized = sanitizeUser(user);
  const token = signToken({ id: user._id, role: user.role, email: user.email });

  res.status(200).json({ message: 'Profile updated', user: sanitized, token });
};
