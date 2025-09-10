import { Bot, InlineKeyboard } from "grammy";
import cron from "node-cron";
import dotenv from "dotenv";
import { UserService } from "./services/userService";
import { MessageService } from "./services/messageService";
import { prisma } from "./lib/db";

dotenv.config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");
export { bot };

// Configuration for target group - set this in your .env file
const TARGET_GROUP_ID = process.env.TELEGRAM_GROUP_ID;

// Rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // messages per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(chatId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(chatId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(chatId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function startBot() {
  console.log("🤖 Starting Telegram Bot...");

  // Register user on /start
  bot.command("start", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) {
      return ctx.reply("❌ Unable to retrieve chat ID.");
    }

    try {
      const user = await UserService.registerUser({
        chatId,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name
      });

      const isAdmin = user.isAdmin;

      if (isAdmin) {
        const keyboard = new InlineKeyboard()
          .text("👥 Manage Users", "admin_users")
          .text("📊 Statistics", "admin_stats")
          .text("⚙️ Settings", "admin_settings").row()
          .text("🌐 Admin Panel", "admin_panel");

        return ctx.reply(
          `👋 <b>Welcome to Admin Panel!</b>\n\n` +
          `You have admin privileges. Use the buttons below to manage the bot:\n\n` +
          `• <b>Manage Users</b> - View and manage registered users\n` +
          `• <b>Statistics</b> - View bot usage statistics\n` +
          `• <b>Settings</b> - Configure bot settings\n` +
          `• <b>Admin Panel</b> - Open web admin panel\n\n` +
          `Use /help for more commands.`,
          { parse_mode: "HTML", reply_markup: keyboard }
        );
      } else {
        return ctx.reply(
          `👋 <b>Welcome to our Bot!</b>\n\n` +
          `You have been registered successfully. You can now receive messages from admins.\n\n` +
          `Use /help to see available commands.`,
          { parse_mode: "HTML" }
        );
      }
    } catch (error) {
      console.error("Error in start command:", error);
      return ctx.reply("❌ An error occurred. Please try again later.");
    }
  });

  // Help command
  bot.command("help", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    const isAdmin = user?.isAdmin || false;

    let helpText = "📋 <b>Available Commands:</b>\n\n";
    
    if (isAdmin) {
      helpText += "🔧 <b>Admin Commands:</b>\n";
      helpText += "• /users - List all registered users\n";
      helpText += "• /promote [@username] - Promote user to admin\n";
      helpText += "• /demote [@username] - Demote admin to user\n";
      helpText += "• /stats - View bot statistics\n\n";
    }
    
    helpText += "👤 <b>User Commands:</b>\n";
    helpText += "• /start - Register with the bot\n";
    helpText += "• /help - Show this help message\n";
    helpText += "• /status - Check your status\n";

    return ctx.reply(helpText, { parse_mode: "HTML" });
  });


  // Status command
  bot.command("status", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user) {
      return ctx.reply("❌ You are not registered. Use /start to register.");
    }

    const status = user.isActive ? "✅ Active" : "❌ Inactive";
    const role = user.isAdmin ? "👑 Admin" : "👤 User";

    return ctx.reply(
      `👤 <b>Your Status:</b>\n\n` +
      `🆔 Chat ID: <code>${user.chatId}</code>\n` +
      `👤 Name: ${user.firstName || 'N/A'} ${user.lastName || ''}\n` +
      `📱 Username: @${user.username || 'N/A'}\n` +
      `🔐 Role: ${role}\n` +
      `📊 Status: ${status}\n` +
      `📅 Registered: ${user.createdAt.toLocaleDateString()}`,
      { parse_mode: "HTML" }
    );
  });

  // Admin commands
  bot.command("users", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.reply("❌ This command is only available for admins.");
    }

    const users = await UserService.getAllUsers();
    const stats = await UserService.getUserStats();

    let message = `👥 <b>Registered Users (${stats.totalUsers})</b>\n\n`;
    message += `📊 <b>Statistics:</b>\n`;
    message += `• Total: ${stats.totalUsers}\n`;
    message += `• Active: ${stats.activeUsers}\n`;
    message += `• Admins: ${stats.admins}\n`;
    message += `• New (7 days): ${stats.recentUsers}\n\n`;

    if (users.length > 0) {
      message += `📋 <b>Recent Users:</b>\n`;
      users.slice(0, 10).forEach((u, index) => {
        const role = u.isAdmin ? "👑" : "👤";
        const status = u.isActive ? "✅" : "❌";
        message += `${index + 1}. ${role} ${u.firstName || 'Unknown'} (@${u.username || 'N/A'}) ${status}\n`;
      });
    }

    return ctx.reply(message, { parse_mode: "HTML" });
  });


  bot.command("promote", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.reply("❌ This command is only available for admins.");
    }

    const args = ctx.message?.text?.split(' ');
    if (!args || args.length < 2) {
      return ctx.reply("❌ Usage: /promote @username");
    }

    const targetUsername = args[1].replace('@', '');
    const targetUser = await prisma.user.findFirst({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return ctx.reply("❌ User not found.");
    }

    if (targetUser.isAdmin) {
      return ctx.reply("❌ User is already an admin.");
    }

    await UserService.promoteToAdmin(targetUser.chatId);
    return ctx.reply(`✅ @${targetUsername} has been promoted to admin.`);
  });

  bot.command("demote", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.reply("❌ This command is only available for admins.");
    }

    const args = ctx.message?.text?.split(' ');
    if (!args || args.length < 2) {
      return ctx.reply("❌ Usage: /demote @username");
    }

    const targetUsername = args[1].replace('@', '');
    const targetUser = await prisma.user.findFirst({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return ctx.reply("❌ User not found.");
    }

    if (!targetUser.isAdmin) {
      return ctx.reply("❌ User is not an admin.");
    }

    await UserService.demoteFromAdmin(targetUser.chatId);
    return ctx.reply(`✅ @${targetUsername} has been demoted from admin.`);
  });



  bot.command("stats", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.reply("❌ This command is only available for admins.");
    }

    const userStats = await UserService.getUserStats();
    const messageStats = await MessageService.getMessageStats();

    const message = 
      `📊 <b>Bot Statistics</b>\n\n` +
      `👥 <b>Users:</b>\n` +
      `• Total: ${userStats.totalUsers}\n` +
      `• Active: ${userStats.activeUsers}\n` +
      `• Admins: ${userStats.admins}\n` +
      `• New (7 days): ${userStats.recentUsers}\n\n` +
      `💬 <b>Messages:</b>\n` +
      `• Total: ${messageStats.totalMessages}\n` +
      `• Sent: ${messageStats.sentMessages}\n` +
      `• Scheduled: ${messageStats.scheduledMessages}\n` +
      `• Today: ${messageStats.todayMessages}\n` +
      `• This Week: ${messageStats.weekMessages}`;

    return ctx.reply(message, { parse_mode: "HTML" });
  });

  // Handle callback queries
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.answerCallbackQuery("❌ Admin access required.");
    }

    switch (data) {
      case "admin_users":
        // Show user management interface
        const users = await UserService.getAllUsers();
        const keyboard = new InlineKeyboard();
        
        users.slice(0, 5).forEach((u, index) => {
          keyboard.text(
            `${u.isAdmin ? '👑' : '👤'} ${u.firstName || 'Unknown'}`,
            `user_${u.id}`
          );
        });
        
        await ctx.editMessageText(
          `👥 <b>User Management</b>\n\nSelect a user to manage:`,
          { parse_mode: "HTML", reply_markup: keyboard }
        );
        break;


      case "admin_stats":
        // Show statistics
        const userStats = await UserService.getUserStats();
        const messageStats = await MessageService.getMessageStats();

        const statsMessage = 
          `📊 <b>Bot Statistics</b>\n\n` +
          `👥 <b>Users:</b> ${userStats.totalUsers} total, ${userStats.activeUsers} active\n` +
          `💬 <b>Messages:</b> ${messageStats.totalMessages} total, ${messageStats.sentMessages} sent, ${messageStats.scheduledMessages} scheduled`;

        await ctx.editMessageText(statsMessage, { parse_mode: "HTML" });
        break;

      case "admin_panel":
        await ctx.answerCallbackQuery("🌐 Opening admin panel...");
        await ctx.reply("🌐 Admin panel: " + (process.env.ADMIN_PANEL_URL || "http://localhost:3000/admin"));
        break;
    }

    await ctx.answerCallbackQuery();
  });



  // Schedule cleanup task
  cron.schedule("0 2 * * *", async () => {
    console.log("🧹 Running daily cleanup...");
    
    // Clean up old rate limit entries
    const now = Date.now();
    for (const [chatId, limit] of rateLimit.entries()) {
      if (now > limit.resetTime) {
        rateLimit.delete(chatId);
      }
    }
    
    console.log("✅ Daily cleanup completed.");
  });

  // Check for scheduled messages every minute
  cron.schedule("* * * * *", async () => {
    try {
      const scheduledMessages = await MessageService.getScheduledMessages();
      
      if (scheduledMessages.length > 0) {
        console.log(`📅 Found ${scheduledMessages.length} scheduled messages to send`);
        
        for (const message of scheduledMessages) {
          try {
            // Format message text
            const messageText = message.title 
              ? `📢 **${message.title}**\n\n${message.content}`
              : message.content;
            
            // Send to group if configured, otherwise send to admin DM
            if (TARGET_GROUP_ID) {
              await bot.api.sendMessage(Number(TARGET_GROUP_ID), messageText);
              console.log(`✅ Sent scheduled message ${message.id} to group ${TARGET_GROUP_ID}`);
            } else {
              await bot.api.sendMessage(Number(message.sender.chatId), messageText);
              console.log(`✅ Sent scheduled message ${message.id} to admin DM`);
            }
            
            // Mark as sent
            await MessageService.markAsSent(message.id);
          } catch (error) {
            console.error(`❌ Failed to send scheduled message ${message.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error checking scheduled messages:", error);
    }
  });

  console.log("✅ Bot commands and handlers registered successfully.");
}
