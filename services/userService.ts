import { prisma } from "../lib/db";

export type RegisterUserInput = {
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export type CreateUserInput = {
  firstName: string;
  lastName?: string;
  phoneno: string;
  username?: string;
  isAdmin?: boolean;
};

export type PasscodeVerificationInput = {
  chatId: string;
  passcode: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export type UserCreationResult = {
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    phoneno: string;
    username: string | null;
    isAdmin: boolean;
  };
  passcode: string;
  success: true;
} | {
  error: string;
  success: false;
};

export const UserService = {
  async registerUser(input: RegisterUserInput) {
    const existing = await prisma.user.findUnique({ where: { chatId: input.chatId } });
    if (existing) {
      // Update basic profile fields if changed
      const updated = await prisma.user.update({
        where: { chatId: input.chatId },
        data: {
          username: input.username ?? existing.username,
          firstName: input.firstName ?? existing.firstName,
          lastName: input.lastName ?? existing.lastName,
          isActive: true,
        },
      });
      return updated;
    }

    const created = await prisma.user.create({
      data: {
        chatId: input.chatId,
        username: input.username || null,
        firstName: input.firstName || null,
        lastName: input.lastName || null,
      },
    });
    return created;
  },

  async getUserByChatId(chatId: string) {
    return prisma.user.findUnique({ where: { chatId } });
  },

  async getAllUsers() {
    return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  },

  async promoteToAdmin(chatId: string) {
    return prisma.user.update({ where: { chatId }, data: { isAdmin: true } });
  },

  async demoteFromAdmin(chatId: string) {
    return prisma.user.update({ where: { chatId }, data: { isAdmin: false } });
  },

  async getUserStats() {
    const [totalUsers, activeUsers, admins, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return { totalUsers, activeUsers, admins, recentUsers };
  },

  /**
   * Generate a secure random passcode for new users
   * @returns {string} 8-character alphanumeric passcode
   */
  generatePasscode(): string {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Excluded O and 0 for clarity
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Create a new user with auto-generated passcode (Admin only)
   * @param {CreateUserInput} input User creation data
   * @returns {Promise<UserCreationResult>} Creation result with user data and passcode
   */
  async createUser(input: CreateUserInput): Promise<UserCreationResult> {
    try {
      // Validate input
      if (!input.firstName?.trim()) {
        return { success: false, error: 'First name is required' };
      }
      
      if (!input.phoneno?.trim()) {
        return { success: false, error: 'Phone number is required' };
      }

      // Check if phone number already exists
      const existingUser = await prisma.user.findFirst({
        where: { phoneno: input.phoneno }
      });
      
      if (existingUser) {
        return { success: false, error: 'Phone number already registered' };
      }

      // Generate secure passcode
      const passcode = this.generatePasscode();

      // Create user with generated passcode
      const user = await prisma.user.create({
        data: {
          firstName: input.firstName.trim(),
          lastName: input.lastName?.trim() || null,
          phoneno: input.phoneno.trim(),
          username: input.username?.trim() || null,
          passcode: passcode,
          isAdmin: input.isAdmin || false,
          isActive: false, // Inactive until they verify via bot
          chatId: '', // Will be set when they verify via bot
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName,
          phoneno: user.phoneno || '',
          username: user.username,
          isAdmin: user.isAdmin,
        },
        passcode,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Failed to create user. Please try again.' };
    }
  },

  /**
   * Verify passcode and register chatId for new user
   * @param {PasscodeVerificationInput} input Verification data
   * @returns {Promise<any>} User object if successful, null if failed
   */
  async verifyPasscodeAndRegister(input: PasscodeVerificationInput) {
    try {
      // Find user by passcode
      const user = await prisma.user.findFirst({
        where: {
          passcode: input.passcode.toUpperCase(),
          chatId: '', // Only unregistered users
          isActive: false, // Only inactive users
        },
      });

      if (!user) {
        return null; // Invalid passcode or user already registered
      }

      // Update user with chatId and additional info
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          chatId: input.chatId,
          username: input.username || user.username,
          firstName: input.firstName || user.firstName,
          lastName: input.lastName || user.lastName,
          isActive: true,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error('Error verifying passcode:', error);
      return null;
    }
  },

  /**
   * Get all pending users (created but not yet registered via bot)
   * @returns {Promise<Array>} List of pending users
   */
  async getPendingUsers() {
    return prisma.user.findMany({
      where: {
        chatId: '',
        isActive: false,
        passcode: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneno: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  },

  /**
   * Delete a pending user (Admin only)
   * @param {string} userId User ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deletePendingUser(userId: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: {
          id: userId,
          chatId: '', // Only allow deletion of unregistered users
          isActive: false,
        },
      });
      return true;
    } catch (error) {
      console.error('Error deleting pending user:', error);
      return false;
    }
  },

  /**
   * Check if a phone number is already registered
   * @param {string} phoneno Phone number to check
   * @returns {Promise<boolean>} True if registered, false otherwise
   */
  async isPhoneNumberRegistered(phoneno: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { phoneno },
    });
    return !!user;
  },

  /**
   * Get user by passcode (for verification purposes)
   * @param {string} passcode The passcode to search for
   * @returns {Promise<any>} User object if found, null otherwise
   */
  async getUserByPasscode(passcode: string) {
    return prisma.user.findFirst({
      where: {
        passcode: passcode.toUpperCase(),
        isActive: false, // Only return unverified users
      },
    });
  },
};

export type UserServiceType = typeof UserService;