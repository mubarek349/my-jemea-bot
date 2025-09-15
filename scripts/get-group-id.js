#!/usr/bin/env node

/**
 * Group ID Helper for Jemea Bot
 * 
 * This script helps you get the correct group/channel ID for your bot
 * Run with: node scripts/get-group-id.js
 */

const { Bot } = require('grammy');
require('dotenv').config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

async function main() {
  console.log('🔍 Telegram Group ID Helper');
  console.log('============================\n');

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
    console.log('   Please set your bot token in .env file first\n');
    process.exit(1);
  }

  console.log('📋 Instructions:');
  console.log('1. Add your bot to the target group/channel');
  console.log('2. Make the bot an admin (required for sending messages)');
  console.log('3. Send any message in the group/channel');
  console.log('4. Check the updates below\n');

  try {
    console.log('🔄 Getting recent updates...\n');
    
    // Get recent updates
    const updates = await bot.api.getUpdates({ limit: 10 });
    
    if (updates.length === 0) {
      console.log('❌ No recent updates found');
      console.log('   Please send a message in your target group/channel first\n');
      return;
    }

    console.log(`📨 Found ${updates.length} recent updates:\n`);
    
    // Process updates and show chat information
    const chats = new Map();
    
    updates.forEach((update, index) => {
      if (update.message && update.message.chat) {
        const chat = update.message.chat;
        const chatKey = chat.id.toString();
        
        if (!chats.has(chatKey)) {
          chats.set(chatKey, {
            id: chat.id,
            title: chat.title || `${chat.first_name || ''} ${chat.last_name || ''}`.trim() || 'Private Chat',
            type: chat.type,
            username: chat.username,
            messageCount: 0
          });
        }
        
        chats.get(chatKey).messageCount++;
      }
    });

    // Display chat information
    let groupIndex = 1;
    chats.forEach((chat) => {
      console.log(`${groupIndex}. 📝 ${chat.title}`);
      console.log(`   🆔 Chat ID: ${chat.id}`);
      console.log(`   📱 Type: ${chat.type}`);
      if (chat.username) {
        console.log(`   🔗 Username: @${chat.username}`);
      }
      console.log(`   💬 Recent messages: ${chat.messageCount}`);
      
      if (chat.type === 'group' || chat.type === 'supergroup' || chat.type === 'channel') {
        console.log(`   ✅ Suitable for TELEGRAM_GROUP_ID`);
        console.log(`   💡 Add to .env: TELEGRAM_GROUP_ID="${chat.id}"`);
      } else {
        console.log(`   ℹ️  Private chat (not suitable for group messaging)`);
      }
      
      console.log('');
      groupIndex++;
    });

    if (chats.size === 0) {
      console.log('❌ No chat information found in recent updates');
      console.log('   Please ensure the bot is added to your target group/channel\n');
    } else {
      console.log('🎯 Next Steps:');
      console.log('1. Copy the Chat ID of your target group/channel');
      console.log('2. Add it to your .env file as TELEGRAM_GROUP_ID="your_chat_id"');
      console.log('3. Restart the bot to apply changes');
      console.log('4. Test with /checkchats command in Telegram\n');
    }

  } catch (error) {
    console.error('❌ Error getting updates:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('1. Invalid bot token');
    console.log('2. Bot is not started yet (/start command not sent)');
    console.log('3. Network connectivity issues\n');
  } finally {
    await bot.stop();
    process.exit(0);
  }
}

main().catch(console.error);