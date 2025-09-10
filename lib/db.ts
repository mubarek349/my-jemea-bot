import { PrismaClient } from '@prisma/client';

// Extend global type for Prisma Client singleton
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Create a singleton instance of Prisma Client
const createPrismaClient = (): PrismaClient => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('Failed to initialize Prisma Client:', error);
    throw error;
  }
};

// Use global variable in development to prevent multiple instances
export const db = globalThis.__prisma ?? createPrismaClient();
export const prisma = db;

// Store the instance globally only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}

