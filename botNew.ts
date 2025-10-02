/**
 * @fileoverview Main Telegram bot implementation for Jemea Bot
 * @description Professional Telegram bot with web dashboard integration,
 * automated messaging, user management, and comprehensive error handling.
 * @author Jemea Bot Team
 * @version 1.0.0
 */

import { Bot, InlineKeyboard } from "grammy";
import cron from "node-cron";
import dotenv from "dotenv";
import { UserService } from "./services/userService";
import { MessageService } from "./services/messageService";
import { prisma } from "./lib/db";
import { logger, LogContext } from "./lib/logger";
import { ErrorHandler, ValidationError } from "./lib/errors";

dotenv.config();

/**
 * Main Telegram bot instance
 * @description Configured with bot token from environment variables
 */
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");
export { bot };

/**
 * Target group ID for broadcasting messages
 * @description Set in environment variables, optional for DM-only mode
 */
const TARGET_GROUP_ID = process.env.TELEGRAM_GROUP_ID;

/**
 * Rate limiting configuration
 * @description Prevents spam and abuse by limiting messages per user
 */
const rateLimit = new Map<string, { count: number; resetTime: number }>();


/**
 * Initialize and start the Telegram bot
 * @description Sets up all bot commands, handlers, and scheduled tasks
 * @throws {Error} If bot token is invalid or database connection fails
 * @example
 * ```typescript
 * await startBot();
 * await bot.start();
 * ```
 */
export async function startBot(): Promise<void> {
  console.log("🤖 Starting Telegram Bot...");

  // Register user on /start
  bot.command("start", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    // Build context safely for exactOptionalPropertyTypes
    const context: LogContext = {
      chatId,
      action: 'user_start'
    };
    if (ctx.from?.id?.toString()) context.userId = ctx.from.id.toString();
    if (ctx.from?.username) context.username = ctx.from.username;

    if (!chatId) {
      logger.error("Unable to retrieve chat ID in start command", context);
      return ctx.reply("❌ Unable to retrieve chat ID.");
    }

    try {
      logger.botAction("User registration started", context);
      
      const user = await UserService.registerUser({
        chatId,
        ...(ctx.from?.username && { username: ctx.from.username }),
        ...(ctx.from?.first_name && { firstName: ctx.from.first_name }),
        ...(ctx.from?.last_name && { lastName: ctx.from.last_name })
      });

      const isAdmin = user.isAdmin;
      logger.userAction(user.id, "User registered successfully", { ...context, isAdmin });

      if (isAdmin) {
        const keyboard = new InlineKeyboard()
          .text("👥 Manage Users", "admin_users")
          .text("📊 Statistics", "admin_stats")
          .text("⚙️ Settings", "admin_settings").row()
          .text("🌐 Admin Panel", "admin_panel");

        logger.botAction("Admin panel displayed", { ...context, isAdmin: true });
        
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
        logger.botAction("User welcome message displayed", { ...context, isAdmin: false });
        
        return ctx.reply(
          `👋 <b>Welcome to our Bot!</b>\n\n` +
          `You have been registered successfully. You can now receive messages from admins.\n\n` +
          `Use /help to see available commands.`,
          { parse_mode: "HTML" }
        );
      }
    } catch (error) {
      const jemeaError = ErrorHandler.handle(error, context);
      logger.error("Error in start command", { ...context, error: jemeaError });
      
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
      helpText += "• /createuser - Create a new user with passcode\n";
      helpText += "• /pendingusers - List users waiting for verification\n";
      helpText += "• /promote [@username] - Promote user to admin\n";
      helpText += "• /demote [@username] - Demote admin to user\n";
      helpText += "• /stats - View bot statistics\n";
      helpText += "• /checkchats - Check chat connectivity\n";
      helpText += "• /retryfailed - Retry failed messages\n";
      helpText += "• /time - Show current time and timezone\n";
      helpText += "• /resettimezone - Reset timezone detection\n\n";
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

  // Professional User Creation Command
  bot.command("newuser", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return ctx.reply("❌ Unable to retrieve chat ID.");

    try {
      const adminUser = await UserService.getUserByChatId(chatId);
      if (!adminUser?.isAdmin) {
        return ctx.reply("❌ This command is only available for admins.");
      }

      const args = ctx.message?.text?.split(' ');
      if (!args || args.length < 3) {
        return ctx.reply(
          `🆕 <b>Create New User</b>\n\n` +
          `<b>Usage:</b> <code>/newuser [firstName] [phone]</code>\n\n` +
          `<b>Examples:</b>\n` +
          `• <code>/newuser John +1234567890</code>\n` +
          `• <code>/newuser "Jane Smith" +1987654321</code>\n\n` +
          `<b>Note:</b> User will receive a passcode to register.`,
          { parse_mode: "HTML" }
        );
      }

      let firstName = args[1];
      let phoneno = args[2];
      let isAdmin = false;

      // Validate that firstName and phoneno are defined
      if (!firstName || !phoneno) {
        return ctx.reply(
          `🆕 <b>Create New User</b>\n\n` +
          `<b>Usage:</b> <code>/newuser [firstName] [phone]</code>\n\n` +
          `<b>Examples:</b>\n` +
          `• <code>/newuser John +1234567890</code>\n` +
          `• <code>/newuser "Jane Smith" +1987654321</code>\n\n` +
          `<b>Note:</b> User will receive a passcode to register.`,
          { parse_mode: "HTML" }
        );
      }

      // Handle quoted names
      if (firstName.startsWith('"')) {
        firstName = firstName.substring(1);
        let nameEnd = 2;
        while (nameEnd < args.length && args[nameEnd - 1] && args[nameEnd - 1]!.endsWith('"')) {
          firstName += ' ' + args[nameEnd];
          nameEnd++;
        }
        firstName = firstName.replace(/"/g, '');
        phoneno = args[nameEnd] || '';
        isAdmin = args[nameEnd + 1] === 'admin';
      } else {
        isAdmin = args[3] === 'admin';
      }

      const result = await UserService.createUser({
        firstName,
        phoneno,
        isAdmin
      });

      if (!result.success) {
        return ctx.reply(`❌ <b>Failed:</b> ${result.error}`, { parse_mode: "HTML" });
      }

      const { user, passcode } = result;
      const roleText = user.isAdmin ? "👑 Admin" : "👤 User";
      
      return ctx.reply(
        `✅ <b>User Created!</b>\n\n` +
        `👤 <b>Name:</b> ${user.firstName}\n` +
        `📱 <b>Phone:</b> ${user.phoneno}\n` +
        `🔐 <b>Role:</b> ${roleText}\n\n` +
        `🔑 <b>Passcode:</b> <code>${passcode}</code>\n\n` +
        `📝 <b>Instructions:</b>\n` +
        `1. Share the passcode with the user\n` +
        `2. User types: <code>/start ${passcode}</code>\n` +
        `3. User will be registered automatically\n\n` +
        `⚠️ Keep the passcode secure!`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error('Error creating user:', error);
      return ctx.reply("❌ Failed to create user. Please try again.");
    }
  });

  // Professional user registration command
  // bot.command("register", async (ctx) => {
  //   const chatId = ctx.chat?.id?.toString();
  //   const userId = ctx.from?.id?.toString();
    
  //   // Build context safely for exactOptionalPropertyTypes
  //   const context: LogContext = {
  //     chatId,
  //     action: 'user_register'
  //   };
  //   if (userId) context.userId = userId;

  //   if (!chatId) {
  //     logger.error("Unable to retrieve chat ID in register command", context);
  //     return ctx.reply("❌ Unable to retrieve chat ID.");
  //   }

  //   try {
  //     // Check if user is already registered
  //     const existingUser = await UserService.getUserByChatId(chatId);
  //     if (existingUser) {
  //       logger.warn("Already registered user tried to register again", context);
  //       return ctx.reply(
  //         `✅ <b>Already Registered</b>\n\n` +
  //         `You are already registered in our system.\n\n` +
  //         `👤 <b>Your Status:</b>\n` +
  //         `• Name: ${existingUser.firstName || 'N/A'} ${existingUser.lastName || ''}\n` +
  //         `• Role: ${existingUser.isAdmin ? '👑 Admin' : '👤 User'}\n` +
  //         `• Status: ${existingUser.isActive ? '✅ Active' : '❌ Inactive'}\n\n` +
  //         `Use /help to see available commands.`,
  //         { parse_mode: "HTML" }
  //       );
  //     }

  //     logger.botAction("User registration initiated", context);

  //     // Start registration flow
  //     const message = 
  //       `🔐 <b>User Registration</b>\n\n` +
  //       `Welcome! To complete your registration, please provide your verification passcode.\n\n` +
  //       `📝 <b>Instructions:</b>\n` +
  //       `• You should have received an 8-character passcode from an administrator\n` +
  //       `• Reply to this message with your passcode\n` +
  //       `• Example: <code>ABC12345</code>\n\n` +
  //       `❓ <b>Don't have a passcode?</b>\n` +
  //       `Contact an administrator to create your account first.\n\n` +
  //       `🔒 <b>Security:</b> Your passcode is single-use and expires after registration.`;

  //     await ctx.reply(message, { parse_mode: "HTML" });

  //     // Set up passcode listening mode for this user
  //     // Note: In a production environment, you might want to use a more sophisticated state management
      
  //   } catch (error) {
  //     const jemeaError = ErrorHandler.handle(error, context);
  //     logger.error("Error in register command", { ...context, error: jemeaError });
      
  //     return ctx.reply("❌ An error occurred during registration. Please try again later.");
  //   }
  // });

  // Command to list pending registrations (Admin only)
  bot.command("pending", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.reply("❌ This command is only available for admins.");
    }

    try {
      const unverifiedUsers = await UserService.getPendingUsers();
      
      if (unverifiedUsers.length === 0) {
        return ctx.reply("✅ No pending user registrations.");
      }

      let message = `⏳ <b>Pending Registrations (${unverifiedUsers.length})</b>\n\n`;
      
      unverifiedUsers.forEach((pendingUser: any, index: number) => {
        const createdDays = Math.floor((Date.now() - pendingUser.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const roleText = pendingUser.isAdmin ? "👑 Admin" : "👤 User";
        
        message += `${index + 1}. <b>${pendingUser.firstName}</b>\n`;
        message += `   📱 ${pendingUser.phoneno}\n`;
        message += `   ${roleText} • Created ${createdDays} days ago\n\n`;
      });

      message += `💡 <b>Note:</b> Users need to complete registration using /register command.`;

      return ctx.reply(message, { parse_mode: "HTML" });

    } catch (error) {
      logger.error("Error in pending command", { error: error instanceof Error ? error : new Error(String(error)), chatId });
      return ctx.reply("❌ An error occurred while fetching pending registrations.");
    }
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

    const targetUsername = args[1]?.replace('@', '') || '';
    if (!targetUsername) {
      return ctx.reply("❌ Usage: /promote @username");
    }
    const targetUser = await prisma.user.findFirst({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return ctx.reply("❌ User not found.");
    }

    if (targetUser.isAdmin) {
      return ctx.reply("❌ User is already an admin.");
    }

    // await UserService.promoteToAdmin(targetUser.chatId);
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

    const targetUsername = args[1]?.replace('@', '') || '';
    if (!targetUsername) {
      return ctx.reply("❌ Usage: /demote @username");
    }
    const targetUser = await prisma.user.findFirst({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return ctx.reply("❌ User not found.");
    }

    if (!targetUser.isAdmin) {
      return ctx.reply("❌ User is not an admin.");
    }

    // await UserService.demoteFromAdmin(targetUser.chatId);
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
      `• Failed: ${messageStats.failedMessages}\n` +
      `• Today: ${messageStats.todayMessages}\n` +
      `• This Week: ${messageStats.weekMessages}`;

    return ctx.reply(message, { parse_mode: "HTML" });
  });

  // New command to check chat connectivity
  bot.command("checkchats", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.reply("❌ This command is only available for admins.");
    }

    let message = `🔍 <b>Chat Connectivity Check</b>\n\n`;
    
    // Check target group configuration
    if (TARGET_GROUP_ID) {
      message += `🎯 <b>Target Group:</b> ${TARGET_GROUP_ID}\n`;
      
      try {
        // Try to get chat info
        const chatInfo = await bot.api.getChat(Number(TARGET_GROUP_ID));
        message += `✅ <b>Status:</b> Connected\n`;
        message += `📝 <b>Title:</b> ${chatInfo.title || 'N/A'}\n`;
        message += `👥 <b>Type:</b> ${chatInfo.type}\n`;
        
        // Try to get member count if it's a group/channel
        if (chatInfo.type === 'supergroup' || chatInfo.type === 'channel') {
          try {
            const memberCount = await bot.api.getChatMembersCount(Number(TARGET_GROUP_ID));
            message += `👤 <b>Members:</b> ${memberCount}\n`;
          } catch (e) {
            message += `👤 <b>Members:</b> Unable to retrieve\n`;
          }
        }
      } catch (error: any) {
        message += `❌ <b>Status:</b> Not accessible\n`;
        message += `🚨 <b>Error:</b> ${error?.description || error?.message || 'Unknown error'}\n`;
      }
    } else {
      message += `⚠️ <b>Target Group:</b> Not configured\n`;
      message += `📝 <b>Note:</b> Messages will be sent to admin DMs\n`;
    }
    
    // Check for failed messages
    const failedMessages = await MessageService.getFailedMessages();
    message += `\n💥 <b>Failed Messages:</b> ${failedMessages.length}\n`;
    
    if (failedMessages.length > 0) {
      message += `\n🔧 <b>Recent Failures:</b>\n`;
      failedMessages.slice(0, 3).forEach((msg, index) => {
        const title = msg.title ? `"${msg.title.substring(0, 30)}..."` : 'Untitled';
        message += `${index + 1}. ${title}: ${msg.errorMessage?.substring(0, 50)}...\n`;
      });
      message += `\n💡 Use /retryfailed to retry failed messages`;
    }

    return ctx.reply(message, { parse_mode: "HTML" });
  });

  // Command to retry failed messages
  bot.command("retryfailed", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.reply("❌ This command is only available for admins.");
    }

    const failedMessages = await MessageService.getFailedMessages();
    
    if (failedMessages.length === 0) {
      return ctx.reply("✅ No failed messages to retry.");
    }

    let retried = 0;
    for (const message of failedMessages) {
      await MessageService.retryFailedMessage(message.id);
      retried++;
    }

    return ctx.reply(`🔄 Scheduled ${retried} failed messages for retry. They will be processed in the next minute.`);
  });

  // Professional user creation command for admins
  bot.command("createuser", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    const context: LogContext = {
      chatId,
      userId: ctx.from?.id?.toString() || '',
      username: ctx.from?.username,
      action: 'create_user_command'
    };

    if (!chatId) {
      logger.error("Unable to retrieve chat ID in createuser command", context);
      return ctx.reply("❌ Unable to retrieve chat ID.");
    }

    try {
      const user = await UserService.getUserByChatId(chatId);
      if (!user?.isAdmin) {
        return ctx.reply("❌ This command is only available for admins.");
      }

      const args = ctx.message?.text?.split(' ');
      if (!args || args.length < 3) {
        const helpMessage = 
          `👤 <b>Create New User</b>\n\n` +
          `<b>Usage:</b> <code>/createuser "First Name" "Phone Number" ["Last Name"] [admin]</code>\n\n` +
          `<b>Examples:</b>\n` +
          `• <code>/createuser "John Doe" "+1234567890"</code>\n` +
          `• <code>/createuser "Jane Smith" "+9876543210" "Manager" admin</code>\n\n` +
          `<b>Notes:</b>\n` +
          `• Phone number must include country code\n` +
          `• Add "admin" at the end to create admin user\n` +
          `• User will receive a passcode to register via bot`;
        
        return ctx.reply(helpMessage, { parse_mode: "HTML" });
      }

      // Parse arguments with proper quote handling
      if (!ctx.message?.text) {
        return ctx.reply("❌ Invalid command format.");
      }
      const text = ctx.message.text.replace('/createuser', '').trim();
      const matches = text.match(/"([^"]+)"/g);
      
      if (!matches || matches.length < 2) {
        return ctx.reply("❌ Please use quotes around names and phone number. Example: /createuser \"John Doe\" \"+1234567890\"");
      }

      const firstName = matches[0]!.replace(/"/g, '').trim();
      const phoneno = matches[1]!.replace(/"/g, '').trim();
      const lastName = matches[2] ? matches[2].replace(/"/g, '').trim() : undefined;
      const isAdmin = text.toLowerCase().includes(' admin');

      logger.botAction("User creation initiated", { ...context, firstName, phoneno, isAdmin });

      // Create user
      const createUserResult = await UserService.createUser({
        firstName,
        phoneno,
        isAdmin,
        ...(lastName && { lastName })
      });

      if (!createUserResult.success) {
        logger.error("User creation failed", { ...context, error: new Error(createUserResult.error) });
        return ctx.reply(`❌ <b>Failed to create user:</b> ${createUserResult.error}`, { parse_mode: "HTML" });
      }

      const { user: createdUser, passcode } = createUserResult;
      logger.userAction(createdUser.id, "User created successfully", { ...context, isAdmin: createdUser.isAdmin });

      // Send success message with passcode
      const roleText = user.isAdmin ? "👑 Admin" : "👤 User";
      const successMessage = 
        `✅ <b>User Created Successfully!</b>\n\n` +
        `👤 <b>Name:</b> ${user.firstName} ${user.lastName || ''}\n` +
        `📱 <b>Phone:</b> ${user.phoneno}\n` +
        `🔐 <b>Role:</b> ${roleText}\n\n` +
        `🔑 <b>Generated Passcode:</b> <code>${passcode}</code>\n\n` +
        `📋 <b>Next Steps:</b>\n` +
        `1. Share the passcode with the user\n` +
        `2. User should start this bot with /start\n` +
        `3. User will be prompted to enter their passcode\n` +
        `4. Upon verification, they'll be registered automatically\n\n` +
        `⚠️ <b>Important:</b> Keep the passcode secure and share it safely!`;

      return ctx.reply(successMessage, { parse_mode: "HTML" });
    } catch (error) {
      const jemeaError = ErrorHandler.handle(error, context);
      logger.error("Error in createuser command", { ...context, error: jemeaError });
      
      return ctx.reply("❌ An error occurred while creating the user. Please try again later.");
    }
  });

  // Command to list pending users
  bot.command("pendingusers", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    try {
      const user = await UserService.getUserByChatId(chatId);
      if (!user?.isAdmin) {
        return ctx.reply("❌ This command is only available for admins.");
      }

      const pendingUsers = await UserService.getPendingUsers();
      
      if (pendingUsers.length === 0) {
        return ctx.reply("✅ No pending users waiting for verification.");
      }

      let message = `⏳ <b>Pending Users (${pendingUsers.length})</b>\n\n`;
      
      pendingUsers.slice(0, 10).forEach((u, index) => {
        const role = u.isAdmin ? "👑" : "👤";
        const createdDate = new Date(u.createdAt).toLocaleDateString();
        message += `${index + 1}. ${role} <b>${u.firstName} ${u.lastName || ''}</b>\n`;
        message += `   📱 ${u.phoneno}\n`;
        message += `   📅 Created: ${createdDate}\n\n`;
      });

      if (pendingUsers.length > 10) {
        message += `\n... and ${pendingUsers.length - 10} more users\n`;
      }

      message += `\n💡 <b>Note:</b> These users have been created but haven't verified their passcode yet.`;

      return ctx.reply(message, { parse_mode: "HTML" });
    } catch (error) {
      console.error('Error in pendingusers command:', error);
      return ctx.reply("❌ Failed to retrieve pending users.");
    }
  });

  // Reset timezone detection command
  bot.command("resettimezone", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    const context: LogContext = {
      chatId,
      userId: ctx.from?.id?.toString(),
      action: 'reset_timezone'
    };

    if (!chatId) {
      logger.error("Unable to retrieve chat ID in resettimezone command", context);
      return ctx.reply("❌ Unable to retrieve chat ID.");
    }

    try {
      const user = await UserService.getUserByChatId(chatId);
      if (!user?.isAdmin) {
        return ctx.reply("❌ This command is only available for admins.");
      }

      // Reset timezone detection
      const now = new Date();
      const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneOffset = now.getTimezoneOffset();
      const timezoneString = `UTC${timezoneOffset <= 0 ? '+' : ''}${-timezoneOffset/60}`;

      logger.botAction("Timezone detection reset", context);

      const message = 
        `🔄 <b>Timezone Detection Reset</b>\n\n` +
        `✅ Timezone detection has been reset successfully.\n\n` +
        `🌍 <b>Current Detection:</b>\n` +
        `• Timezone: <code>${timezoneId}</code>\n` +
        `• Offset: <code>${timezoneString}</code>\n` +
        `• Local Time: <code>${now.toLocaleString()}</code>\n` +
        `• UTC Time: <code>${now.toUTCString()}</code>\n\n` +
        `💡 <b>Note:</b> Fresh timezone detection will be used for all future operations.`;

      return ctx.reply(message, { parse_mode: "HTML" });
    } catch (error) {
      const jemeaError = ErrorHandler.handle(error, context);
      logger.error("Error in resettimezone command", { ...context, error: jemeaError });
      
      return ctx.reply("❌ An error occurred while resetting timezone detection.");
    }
  });

  // Professional time and timezone command
  bot.command("time", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const user = await UserService.getUserByChatId(chatId);
    if (!user?.isAdmin) {
      return ctx.reply("❌ This command is only available for admins.");
    }

    try {
      const now = new Date();
      const timezoneOffset = now.getTimezoneOffset();
      const timezoneString = `UTC${timezoneOffset <= 0 ? '+' : ''}${-timezoneOffset/60}`;
      const timezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Detect if DST is active
      const january = new Date(now.getFullYear(), 0, 1);
      const july = new Date(now.getFullYear(), 6, 1);
      const isDST = now.getTimezoneOffset() !== Math.max(january.getTimezoneOffset(), july.getTimezoneOffset());
      
      // Format times professionally
      const localTime = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
      
      const utcTime = now.toUTCString();
      const isoTime = now.toISOString();
      
      const message = 
        `🕐 <b>System Time Information</b>\n\n` +
        `🌍 <b>Server Location:</b>\n` +
        `• Timezone: <code>${timezoneId}</code>\n` +
        `• Offset: <code>${timezoneString}</code> (${Math.abs(timezoneOffset)} minutes)\n` +
        `• DST Active: ${isDST ? '✅ Yes' : '❌ No'}\n\n` +
        `⏰ <b>Current Time:</b>\n` +
        `• Local: <code>${localTime}</code>\n` +
        `• UTC: <code>${utcTime}</code>\n` +
        `• ISO: <code>${isoTime}</code>\n\n` +
        `📊 <b>System Info:</b>\n` +
        `• Bot Uptime: ${process.uptime().toFixed(0)} seconds\n` +
        `• Node.js: ${process.version}\n` +
        `• Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\n\n` +
        `💡 <b>Note:</b> All scheduled messages are converted to UTC for storage and delivery.`;

      return ctx.reply(message, { parse_mode: "HTML" });
    } catch (error) {
      console.error('Error in time command:', error);
      return ctx.reply("❌ Failed to retrieve time information.");
    }
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

    try {
      switch (data) {
        case "admin_users":
          // Show user management interface
          const users = await UserService.getAllUsers();
          const keyboard = new InlineKeyboard();
          
          users.slice(0, 5).forEach((u) => {
            keyboard.text(
              `${u.isAdmin ? '👑' : '👤'} ${u.firstName || 'Unknown'}`,
              `user_${u.id}`
            );
          });
          
          await ctx.editMessageText(
            `👥 <b>User Management</b>\n\nSelect a user to manage:`,
            { parse_mode: "HTML", reply_markup: keyboard }
          );
          await ctx.answerCallbackQuery();
          return;

        case "admin_stats":
          // Show statistics
          const userStats = await UserService.getUserStats();
          const messageStats = await MessageService.getMessageStats();

          const statsMessage = 
            `📊 <b>Bot Statistics</b>\n\n` +
            `👥 <b>Users:</b> ${userStats.totalUsers} total, ${userStats.activeUsers} active\n` +
            `💬 <b>Messages:</b> ${messageStats.totalMessages} total, ${messageStats.sentMessages} sent, ${messageStats.scheduledMessages} scheduled`;

          await ctx.editMessageText(statsMessage, { parse_mode: "HTML" });
          await ctx.answerCallbackQuery();
          return;

        case "admin_panel":
          await ctx.answerCallbackQuery("🌐 Opening admin panel...");
          await ctx.reply("🌐 Admin panel: " + (process.env.ADMIN_PANEL_URL || "http://localhost:3000/admin"));
          return;

        default:
          // Handle unknown callback data
          logger.warn("Unknown callback query data received", { data, chatId });
          await ctx.answerCallbackQuery("❌ Unknown action.");
          return;
      }
    } catch (error) {
      logger.error("Error handling callback query", { 
        error: error instanceof Error ? error : new Error(String(error)), 
        data, 
        chatId 
      });
      return ctx.answerCallbackQuery("❌ An error occurred.");
    }
  });

  // Handle text messages for passcode verification
  bot.on("message:text", async (ctx) => {
    const chatId = ctx.chat?.id?.toString();
    const messageText = ctx.message?.text?.trim();
    
    if (!chatId || !messageText) return;

    // Skip if it's a command
    if (messageText.startsWith('/')) return;

    try {
      // Check if user is already registered
      const existingUser = await UserService.getUserByChatId(chatId);
      if (existingUser) return; // User already registered, ignore text messages

      // Check if this could be a passcode (8 alphanumeric characters)
      const passcodePattern = /^[A-Z0-9]{8}$/i;
      if (!passcodePattern.test(messageText)) {
        return ctx.reply(
          "🔐 <b>Registration Required</b>\n\n" +
          "To get started, please use the /register command and follow the instructions.\n\n" +
          "If you're trying to verify your passcode, make sure it's exactly 8 characters (letters and numbers only).",
          { parse_mode: "HTML" }
        );
      }

      // Attempt to verify passcode
      const verificationResult = await UserService.verifyPasscodeAndRegister({
        chatId,
        passcode: messageText.toUpperCase(),
        ...(ctx.from?.username && { username: ctx.from.username }),
        ...(ctx.from?.first_name && { firstName: ctx.from.first_name }),
        ...(ctx.from?.last_name && { lastName: ctx.from.last_name })
      });

      if (!verificationResult) {
        return ctx.reply(
          "❌ <b>Invalid Passcode</b>\n\n" +
          "The passcode you entered is not valid or has already been used.\n\n" +
          "📝 <b>Please check:</b>\n" +
          "• Make sure you entered the correct 8-character passcode\n" +
          "• Verify the passcode hasn't expired\n" +
          "• Contact an administrator if you need a new account\n\n" +
          "💡 Use /register to start the verification process again.",
          { parse_mode: "HTML" }
        );
      }

      // Registration successful
      const roleText = verificationResult.isAdmin ? "👑 Admin" : "👤 User";
      const welcomeMessage = verificationResult.isAdmin
        ? `👋 <b>Welcome, Administrator!</b>\n\n` +
          `Your admin account has been successfully activated.\n\n` +
          `👤 <b>Your Details:</b>\n` +
          `• Name: ${verificationResult.firstName || 'N/A'} ${verificationResult.lastName || ''}\n` +
          `• Role: ${roleText}\n` +
          `• Status: ✅ Active\n\n` +
          `🔧 <b>Admin Commands:</b>\n` +
          `• /createuser - Create new users\n` +
          `• /pending - View pending registrations\n` +
          `• /users - Manage existing users\n` +
          `• /stats - View system statistics\n` +
          `• /help - View all available commands\n\n` +
          `🌐 <b>Admin Panel:</b> Access the web dashboard for advanced management features.`
        : `👋 <b>Welcome to our service!</b>\n\n` +
          `Your account has been successfully activated.\n\n` +
          `👤 <b>Your Details:</b>\n` +
          `• Name: ${verificationResult.firstName || 'N/A'} ${verificationResult.lastName || ''}\n` +
          `• Role: ${roleText}\n` +
          `• Status: ✅ Active\n\n` +
          `📱 <b>Available Commands:</b>\n` +
          `• /status - Check your account status\n` +
          `• /help - View available commands\n\n` +
          `You will now receive important notifications and updates from our administrators.`;

      await ctx.reply(welcomeMessage, { parse_mode: "HTML" });

      // Log successful registration
      logger.userAction(verificationResult.id, "User completed registration via passcode", {
        chatId,
        userId: ctx.from?.id?.toString(),
        action: 'passcode_verification_success',
        isAdmin: verificationResult.isAdmin
      });
      
      return;

    } catch (error) {
      logger.error("Error processing passcode verification", { 
        error: error instanceof Error ? error : new Error(String(error)), 
        chatId, 
        action: 'passcode_verification_error' 
      });
      
      return ctx.reply(
        "❌ <b>Verification Error</b>\n\n" +
        "An error occurred while processing your passcode. Please try again or contact support.\n\n" +
        "Use /register to restart the verification process.",
        { parse_mode: "HTML" }
      );
    }
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
          const messageContext: LogContext = {
            messageId: message.id,
            // chatId: TARGET_GROUP_ID || message.sender.chatId,
            userId: message.senderId,
            action: 'send_scheduled_message'
          };

          try {
            // Format message text
            const messageText = message.title 
              ? `📢 **${message.title}**\n\n${message.content}`
              : message.content;
            
            let targetChatId: number;
            let deliveryMethod: string;
            
            // Determine where to send the message
            if (TARGET_GROUP_ID) {
              targetChatId = Number(TARGET_GROUP_ID);
              deliveryMethod = `group ${TARGET_GROUP_ID}`;
            } else {
              targetChatId = Number(message.sender.chatId);
              deliveryMethod = `admin DM (${message.sender.chatId})`;
            }
            
            // Validate chat ID before sending
            if (isNaN(targetChatId)) {
              const error = new ValidationError(`Invalid chat ID: ${targetChatId}`, messageContext);
              logger.error("Invalid chat ID for scheduled message", { ...messageContext, error });
              await MessageService.markMessageAsFailed(message.id, 'Invalid chat ID');
              continue;
            }
            
            // Try to send the message
            const startTime = Date.now();
            await bot.api.sendMessage(targetChatId, messageText);
            const duration = Date.now() - startTime;
            
            logger.messageSent(message.id, targetChatId.toString(), { ...messageContext, duration });
            logger.performance(`Send message to ${deliveryMethod}`, duration, messageContext);
            
            // Mark as sent
            await MessageService.markAsSent(message.id);
            
          } catch (error: any) {
            const jemeaError = ErrorHandler.handleTelegramError(error, messageContext);
            logger.messageFailed(message.id, jemeaError, messageContext);
            
            // Mark message as failed with error details
            await MessageService.markMessageAsFailed(message.id, jemeaError.message);
            
            // If it's a "chat not found" error, we should handle it specially
            if (error?.description?.includes('chat not found')) {
              logger.warn("Chat not found error detected", {
                ...messageContext,
                error: jemeaError,
                suggestions: [
                  'Bot is still member of the target chat/channel',
                  'Chat ID is correct',
                  'Bot has permission to send messages'
                ]
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Error checking scheduled messages:", error);
    }
  });

  console.log("✅ Bot commands and handlers registered successfully.");
}
