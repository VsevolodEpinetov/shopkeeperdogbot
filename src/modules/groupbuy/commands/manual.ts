import { Composer } from 'telegraf';
import { KickstarterContext } from '../../types/customContext';
import { isSuperUser } from '../../util';
import db from '../../db/index';

const composer = new Composer<KickstarterContext>();

composer.command(['manual', 'nm', 'm'], async (ctx) => {
  if (!isSuperUser(ctx.from!.id.toString())) {
    return;
  }

  const groupbuy = await db('groupbuys').where('telegramGroupID', ctx.chat!.id.toString()).first();
  if (groupbuy) {
    return ctx.reply('Groupbuy already exists');
  }

  return ctx.scene.enter('MANUAL_PROJECT_0_URL');
});

export default composer; 