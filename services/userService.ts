import { prisma } from "../lib/db";

export type RegisterUserInput = {
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
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
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
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
};

export type UserServiceType = typeof UserService;



