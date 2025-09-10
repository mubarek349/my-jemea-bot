import { startBot, bot } from "./botNew";

(async () => {
  try {
    await startBot();
    console.log("🚀 Starting the bot...");
    await bot.start();
    console.log("✅ Bot started successfully!");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
})();