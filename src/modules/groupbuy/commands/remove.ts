import { Composer } from 'telegraf';
import { KickstarterContext } from '../../types/customContext';
import { isSuperUser } from '../../util';
import db from '../../db/index';

const composer = new Composer<KickstarterContext>();

composer.command(['remove', 'rm', 'clear'], async (ctx) => {
  if (!isSuperUser(ctx.from!.id.toString())) {
    return;
  }

  try {
    await db('groupbuys')
      .where('telegramGroupID', ctx.chat!.id.toString())
      .del();

    await ctx.reply('✅ All active groupbuys have been removed from this group.');
  } catch (error) {
    console.error('Error removing groupbuys:', error);
    await ctx.reply('❌ Failed to remove groupbuys. Please try again.');
  }
});

export default composer; 