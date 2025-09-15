import { prisma } from "../lib/db";

export const MessageService = {
  async sendMessage(senderId: string, content: string, title?: string, scheduledFor?: Date) {
    return prisma.message.create({
      data: {
        content,
        title: title || null,
        senderId,
        scheduledFor: scheduledFor || null,
        sent: !scheduledFor, // If no scheduled time, mark as sent immediately
      },
    });
  },

  async getScheduledMessages() {
    const now = new Date();
    return prisma.message.findMany({
      where: {
        scheduledFor: {
          lte: now, // scheduled time has passed
        },
        sent: false, // not yet sent
      },
      include: {
        sender: {
          select: { chatId: true, firstName: true, username: true }
        }
      }
    });
  },

  async markAsSent(messageId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: { 
        sent: true,
        errorMessage: null // Clear any previous error
      }
    });
  },

  async markMessageAsFailed(messageId: string, errorMessage: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: {
        sent: false,
        errorMessage: errorMessage
      }
    });
  },

  async getFailedMessages() {
    return prisma.message.findMany({
      where: {
        sent: false,
        errorMessage: {
          not: null
        }
      },
      include: {
        sender: {
          select: { chatId: true, firstName: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async retryFailedMessage(messageId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: {
        errorMessage: null,
        scheduledFor: new Date() // Retry immediately
      }
    });
  },

  async getMessageStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalMessages, sentMessages, scheduledMessages, failedMessages, todayMessages, weekMessages] = await Promise.all([
      prisma.message.count(),
      prisma.message.count({ where: { sent: true } }),
      prisma.message.count({ where: { sent: false, scheduledFor: { not: null }, errorMessage: null } }),
      prisma.message.count({ where: { sent: false, errorMessage: { not: null } } }),
      prisma.message.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.message.count({ where: { createdAt: { gte: startOfWeek } } }),
    ]);

    return { totalMessages, sentMessages, scheduledMessages, failedMessages, todayMessages, weekMessages };
  },
};

export type MessageServiceType = typeof MessageService;



