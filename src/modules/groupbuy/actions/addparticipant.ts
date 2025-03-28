import { Composer } from 'telegraf';
import { GroupBuy, Participant, Project } from '../../types/specificInterfaces';
import db from '../../db/index';
import { updateGroupBuyMessages } from '../util';
import { KickstarterContext } from '../../types/customContext';
const composer = new Composer<KickstarterContext>();

composer.action('add_me', async (ctx: KickstarterContext) => {
  if (!ctx.from!.username) {
    return ctx.answerCbQuery('You need to have a telegram username to join my groupbuys!');
  }

  const telegramGroupID: string = ctx.chat!.id.toString();

  const groupbuy: GroupBuy = await db('groupbuys').where('telegramGroupID', telegramGroupID).first();
  if (!groupbuy) {
    return;
  }

  const userID: string = ctx.from!.id.toString();

  const participant: Participant = await db('groupbuy_participants').where('telegramGroupID', telegramGroupID).where('telegramID', userID).first();
  if (participant) {
    const participantNumber = Number((await db('groupbuy_participants')
      .where('telegramGroupID', telegramGroupID)
      .count()
      .first())?.count || 0);
    return ctx.answerCbQuery(`You are already in! You're #${participantNumber}`);
  }

  await db('groupbuy_participants').insert({telegramGroupID, telegramID: userID, paid: false});
  await db('groupbuy_joiners').where('telegramGroupID', telegramGroupID).where('telegramID', userID).delete();

  const project: Project = await db('projects').where('id', groupbuy.projectID).first();
  const projectPrice: number = JSON.parse(project.selectedPledge as string).price;

  const newParticipants: Participant[] = await db('groupbuy_participants').where('telegramGroupID', groupbuy.telegramGroupID).select('*');
  const newParticipantsCount: number = newParticipants.length;
  const newPricePerMember: number = Math.ceil((projectPrice / newParticipantsCount) * 100) / 100;

  await db('groupbuys')
    .where('telegramGroupID', telegramGroupID)
    .update({ pricePerMember: newPricePerMember });

  await updateGroupBuyMessages(ctx, groupbuy, project, newParticipants);

  await ctx.reply(`@${ctx.from!.username} added to groupbuy! Price dropped to €${newPricePerMember}`);
});

export default composer;
