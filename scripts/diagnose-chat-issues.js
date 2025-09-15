#!/usr/bin/env node

/**
 * Chat Diagnostic Tool for Jemea Bot
 * 
 * This script helps diagnose and fix chat connectivity issues
 * Run with: node scripts/diagnose-chat-issues.js
 */

const { PrismaClient } = require('@prisma/client');
const { Bot } = require('grammy');
require('dotenv').config();

const prisma = new PrismaClient();
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

async function main() {
  console.log('🔍 Jemea Bot Chat Diagnostic Tool');
  console.log('=====================================\n');

  // Show timezone information
  const now = new Date();
  console.log('🕐 Timezone Information:');
  console.log(`   Current time: ${now.toLocaleString()} (Local)`);
  console.log(`   UTC time: ${now.toUTCString()}`);
  console.log(`   Timezone offset: ${now.getTimezoneOffset()} minutes (UTC${now.getTimezoneOffset() <= 0 ? '+' : ''}${-now.getTimezoneOffset()/60})\n`);

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   TELEGRAM_GROUP_ID: ${process.env.TELEGRAM_GROUP_ID || '❌ Not configured'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}\n`);

  // Get failed messages
  console.log('💥 Failed Messages Analysis:');
  try {
    const failedMessages = await prisma.message.findMany({
      where: {
        sent: false,
        errorMessage: { not: null }
      },
      include: {
        sender: {
          select: { chatId: true, firstName: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (failedMessages.length === 0) {
      console.log('   ✅ No failed messages found');
    } else {
      console.log(`   Found ${failedMessages.length} failed messages:`);
      failedMessages.forEach((msg, index) => {
        const title = msg.title ? `"${msg.title.substring(0, 40)}..."` : 'Untitled';
        console.log(`   ${index + 1}. ${title}`);
        console.log(`      Error: ${msg.errorMessage?.substring(0, 100)}...`);
        console.log(`      Created: ${msg.createdAt.toISOString()}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
  }

  // Test target group connectivity
  if (process.env.TELEGRAM_GROUP_ID) {
    console.log('\n🎯 Target Group Connectivity:');
    try {
      const chatId = Number(process.env.TELEGRAM_GROUP_ID);
      const chatInfo = await bot.api.getChat(chatId);
      
      console.log(`   ✅ Connected to: ${chatInfo.title || 'Unnamed chat'}`);
      console.log(`   📝 Type: ${chatInfo.type}`);
      console.log(`   🆔 ID: ${chatId}`);
      
      // Try to get member count
      if (chatInfo.type === 'supergroup' || chatInfo.type === 'channel') {
        try {
          const memberCount = await bot.api.getChatMembersCount(chatId);
          console.log(`   👥 Members: ${memberCount}`);
        } catch (e) {
          console.log(`   👥 Members: Unable to retrieve (${e.description || e.message})`);
        }
      }

      // Test bot permissions
      try {
        const botMember = await bot.api.getChatMember(chatId, bot.botInfo.id);
        console.log(`   🤖 Bot status: ${botMember.status}`);
        if (botMember.status === 'administrator') {
          console.log(`   🔑 Permissions: Administrator`);
        } else if (botMember.status === 'member') {
          console.log(`   🔑 Permissions: Member`);
        }
      } catch (e) {
        console.log(`   🤖 Bot status: ${e.description || e.message}`);
      }

    } catch (error) {
      console.log(`   ❌ Cannot connect to target group:`);
      console.log(`      Error: ${error.description || error.message}`);
      console.log(`      Chat ID: ${process.env.TELEGRAM_GROUP_ID}`);
      console.log('\n   🔧 Possible fixes:');
      console.log('      1. Check if bot is still a member of the chat/channel');
      console.log('      2. Verify the TELEGRAM_GROUP_ID is correct');
      console.log('      3. Ensure bot has permission to send messages');
      console.log('      4. Check if the chat/channel still exists');
    }
  } else {
    console.log('\n🎯 Target Group: Not configured (messages will go to admin DMs)');
  }

  // Get recent scheduled messages
  console.log('\n📅 Recent Scheduled Messages:');
  try {
    const scheduledMessages = await prisma.message.findMany({
      where: {
        scheduledFor: { not: null },
        sent: false
      },
      orderBy: { scheduledFor: 'asc' },
      take: 5,
      include: {
        sender: {
          select: { firstName: true, username: true }
        }
      }
    });

    if (scheduledMessages.length === 0) {
      console.log('   ✅ No pending scheduled messages');
    } else {
      console.log(`   Found ${scheduledMessages.length} pending messages:`);
      scheduledMessages.forEach((msg, index) => {
        const title = msg.title ? `"${msg.title.substring(0, 40)}..."` : 'Untitled';
        const scheduledDate = new Date(msg.scheduledFor);
        const localTime = scheduledDate.toLocaleString();
        const utcTime = scheduledDate.toUTCString();
        const isPastDue = scheduledDate < new Date();
        console.log(`   ${index + 1}. ${title}`);
        console.log(`      Scheduled: ${localTime} (Local) / ${utcTime} (UTC) ${isPastDue ? '(OVERDUE)' : ''}`);
        console.log(`      Error: ${msg.errorMessage || 'None'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
  }

  console.log('\n🔧 Recommendations:');
  console.log('   1. Use /checkchats command in Telegram to test connectivity');
  console.log('   2. Use /retryfailed command to retry failed messages');
  console.log('   3. Check bot permissions in target group/channel');
  console.log('   4. Verify environment variables are correctly set');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Diagnostic tool error:', error);
  process.exit(1);
});