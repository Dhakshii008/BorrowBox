import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const handoverExpirySecs = () => {
  const ttl = process.env.HANDOVER_TTL || '15m';
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60;
  const n = Number(match[1]);
  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  return n * unit;
};

export const signHandoverToken = (payload) => {
  const expiresIn = `${handoverExpirySecs()}s`;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const verifyHandoverToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const generateHandoverCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};