import { Telegraf, Scenes, session } from 'telegraf';
import dotenv from 'dotenv';
import path from 'path';
import { getAllFilesFromFolder } from './modules/util';
import * as db from './modules/db/actions';
import { CustomContext, KickstarterContext } from './modules/types/customContext'

dotenv.config();

if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("❌ Missing TELEGRAM_TOKEN in .env file.");
}

// Initialize bot
const bot = new Telegraf<CustomContext>(process.env.TELEGRAM_TOKEN);

// Store user info when they send a message
bot.on('message', async (ctx: CustomContext, next) => {
  if (ctx.from) {
    const userData = {
      telegramID: ctx.from.id.toString(),
      telegramUsername: ctx.from.username || '',
      telegramFirstName: ctx.from.first_name,
      telegramLastName: ctx.from.last_name || '',
      lastSeenAt: new Date()
    }
    await db.upsertUser(userData);
  }
  return next();
});

// Load all Group Buy scenes dynamically
const kickstarterScenes = getAllFilesFromFolder(
  path.join(__dirname, './modules/groupbuy/scenes')
).map((file: string) => require(file).default);

// Create a single stage with all scenes
const stage = new Scenes.Stage<KickstarterContext>(kickstarterScenes);

// Register middleware
bot.use(session()); 
bot.use(stage.middleware());

// Change the import name to match what we're exporting
import groupbuyComposer from './modules/groupbuy';
bot.use(groupbuyComposer);

bot.launch();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
