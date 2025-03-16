import { Composer } from 'telegraf';
import { Participant, GroupBuy } from '../../types/specificInterfaces';
import db from '../../db/index';
import { TelegramData } from '../../settings';
const composer = new Composer();

composer.on('left_chat_member', async (ctx) => {
  const telegramGroupID: string = ctx.chat!.id.toString();

  const groupbuy: GroupBuy = await db('groupbuys').where('telegramGroupID', telegramGroupID).first();
  if (!groupbuy) {
    return;
  }

  const userID: string = ctx.from!.id.toString();
  const wasParticipant: Participant = await db('groupbuy_participants').where('telegramGroupID', telegramGroupID).where('telegramID', userID).first();

  await db('groupbuy_joiners').where('telegramGroupID', telegramGroupID).where('telegramID', userID).delete();


  await db('groupbuy_participants').where('telegramGroupID', telegramGroupID).where('telegramID', userID).delete();

  // if was removed from the participants list, send message
  if (wasParticipant) {
    // update price per member
    const groupbuy: GroupBuy = await db('groupbuys').where('telegramGroupID', telegramGroupID).first();
    const participants = await db('groupbuy_participants').where('telegramGroupID', groupbuy.telegramGroupID).select('*');
    const newParticipantsCount = participants.length;
    const newPricePerMember = Math.ceil((groupbuy.pricePerMember / newParticipantsCount) * 100) / 100;
    await db('groupbuys').where('telegramGroupID', telegramGroupID).update({pricePerMember: newPricePerMember});

    ctx.telegram.sendMessage(TelegramData.ChatsIDs.Epinetov, `Removed ${ctx.from!.username} from groupbuy! New price per member is €${newPricePerMember}`);
  }
});

export default composer; 