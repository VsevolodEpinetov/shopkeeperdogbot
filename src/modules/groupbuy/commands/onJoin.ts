import { Composer } from 'telegraf';
import { KickstarterContext } from '../../types/customContext';
import db from '../../db/index';
import { GroupBuy } from '../../types/specificInterfaces';
const composer = new Composer<KickstarterContext>();

composer.on('new_chat_members', async (ctx) => {
  const telegramGroupID: string = ctx.chat!.id.toString();

  const groupbuy: GroupBuy = await db('groupbuys').where('telegramGroupID', telegramGroupID).first();
  if (!groupbuy) {
    return;
  }

  const userID: string = ctx.from!.id.toString();

  await db('groupbuy_joiners').insert({telegramGroupID, telegramID: userID});

  if (!ctx.from!.username) {
    return ctx.telegram.sendMessage(telegramGroupID, `${ctx.from!.first_name}, you need to have a telegram username to join my groupbuys!`);
  }
});

export default composer;