import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { CustomerTier, Role, type User } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type { SafeUser } from '../types/auth.js';

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: user.tier ?? CustomerTier.STANDARD,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createCustomerAccount(input: z.infer<typeof signupSchema>) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AuthError('An account with this email already exists.', 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  return toSafeUser(user);
}

export async function authenticateUser(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.isActive) {
    throw new AuthError('Invalid email or password.', 401);
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthError('Invalid email or password.', 401);
  }

  return toSafeUser(user);
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}
