import { Composer } from 'telegraf';
import db from '../../db/index';
import { GroupBuy, Participant, Project } from '../../types/specificInterfaces';
const composer = new Composer();

composer.hears(/add me/i, async (ctx) => {
  const telegramGroupID: string = ctx.chat!.id.toString();
  const groupbuy: GroupBuy = await db('groupbuys').where('telegramGroupID', telegramGroupID).first();
  if (!groupbuy) {
    return;
  }

  if (!ctx.from!.username) {
    return ctx.reply(`${ctx.from!.first_name}, you need to have a telegram username to join my groupbuys!`);
  }

  const userID: string = ctx.from!.id.toString();

  const participant: Participant = await db('groupbuy_participants').where('telegramGroupID', telegramGroupID).where('telegramID', userID).first();
  if (participant) {
    const participantNumber: number = Number((await db('groupbuy_participants')
      .where('telegramGroupID', telegramGroupID)
      .count()
      .first())?.count || 0);
    return ctx.reply(`You are already in, ${ctx.from!.username}! You're #${participantNumber}`);
  }

  await db('groupbuy_participants').insert({telegramGroupID, telegramID: userID, paid: false});
  await db('groupbuy_joiners').where('telegramGroupID', telegramGroupID).where('telegramID', userID).delete();

  const project: Project = await db('projects').where('id', groupbuy.projectID).first();
  const projectPrice: number = JSON.parse(project.selectedPledge as string).price;

  const participants: Participant[] = await db('groupbuy_participants').where('telegramGroupID', groupbuy.telegramGroupID).select('*');
  const newParticipantsCount: number = participants.length;
  const newPricePerMember: number = Math.ceil((projectPrice / newParticipantsCount) * 100) / 100;
  await db('groupbuys')
  .where('telegramGroupID', telegramGroupID)
  .update({ pricePerMember: newPricePerMember });

  await ctx.reply(`@${ctx.from!.username} added to groupbuy! Price dropped to €${newPricePerMember}`);
});

export default composer; 