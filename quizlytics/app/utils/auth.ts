import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// Verify a password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Generate a token
export function generateToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
}

// Verify a token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}

// Get current user from cookies
export function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

// Generate a unique quiz code
export function generateQuizCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
} 