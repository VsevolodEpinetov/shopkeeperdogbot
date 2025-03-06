import { Composer } from 'telegraf';
import { GroupBuy, Participant, Project } from '../../types/specificInterfaces';
import db from '../../db/index';

const composer = new Composer();

composer.action('add_me', async (ctx) => {
  const telegramGroupID: string = ctx.chat!.id.toString();
  const userID: string = ctx.from!.id.toString();

  const groupbuy: GroupBuy = await db('groupbuys').where('telegramGroupID', telegramGroupID).first();
  if (!groupbuy) {
    return ctx.reply('Groupbuy not found');
  }

  const participant: Participant = await db('groupbuy_participants').where('telegramGroupID', telegramGroupID).where('telegramID', userID).first();
  if (participant) {
    const participantNumber = Number((await db('groupbuy_participants')
      .where('telegramGroupID', telegramGroupID)
      .count()
      .first())?.count || 0);
    return ctx.reply(`You are already in! You're #${participantNumber}`);
  }

  await db('groupbuy_participants').insert({telegramGroupID, telegramID: userID, paid: false});


});

export default composer;
