import { Composer } from 'telegraf';
import { KickstarterContext } from '../../types/customContext';
import { GroupBuy, Project, Participant, ExpectedPayment } from '../../types/specificInterfaces';
import db from '../../db/index';
import { updateGroupBuyMessages, sendPaymentInstructions } from '../util';
import { GroupBuysData } from '../../settings';
import { isSuperUser } from '../../util';
const composer = new Composer<KickstarterContext>();

composer.action(/^setstatus_(.*)$/, async (ctx) => {
  if (!isSuperUser(ctx.from!.id.toString())) {
    return;
  }

  if (!('data' in ctx.callbackQuery!)) return;
  await ctx.deleteMessage();
  const status = ctx.callbackQuery!.data.split('_')[1];
  const telegramGroupID = ctx.chat!.id.toString();

  // find groupbuy by telegramGroupID using knex
  const groupbuy: GroupBuy = await db('groupbuys').where('telegramGroupID', telegramGroupID).first();
  if (!groupbuy) {
    return ctx.reply('Groupbuy not found');
  }

  // get project
  const project: Project = await db('projects').where('id', groupbuy.projectID).first();
  if (!project) {
    return ctx.reply('Project not found');
  }

  // get participants
  const participants: Participant[] = await db('groupbuy_participants').where('telegramGroupID', telegramGroupID).select('*');
  if (!participants) {
    return ctx.reply('Participants not found');
  }

  // update status
  await db('groupbuys').where('telegramGroupID', telegramGroupID).update({ status });

  if (status === 'payment') {
    // check if expected payments were already created  
    const unpaidExpectedPayments = await db('expected_payments')
      .where('telegramGroupID', telegramGroupID)
      .where('completed', false)
      .select('*');

    if (unpaidExpectedPayments.length === 0) {
      // create expected payments
      await db('expected_payments').insert(
        participants
          .filter(p => !p.paid)
          .map(p => ({
            telegramGroupID,
            telegramID: p.telegramID,
            amount: groupbuy.pricePerMember,
            payment_method: 'PayPal',
            completed: false
          }))
      );

      await db('groupbuys').where('telegramGroupID', telegramGroupID).update({ finalPrice: groupbuy.pricePerMember });
      await sendPaymentInstructions(ctx, groupbuy.pricePerMember);
    }
  }
  const updatedGroupbuy: GroupBuy = await db('groupbuys').where('telegramGroupID', telegramGroupID).first();
  updateGroupBuyMessages(ctx, updatedGroupbuy, project, participants);

  ctx.reply(`Status updated to ${GroupBuysData.StatusMessages[status]}`);
});

export default composer;