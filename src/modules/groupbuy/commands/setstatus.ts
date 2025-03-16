import { Composer, Markup } from 'telegraf';
import { KickstarterContext } from '../../types/customContext';
import { isSuperUser, splitMenu } from '../../util';
import { GroupBuysData } from '../../settings';

const composer = new Composer<KickstarterContext>();

interface KeyboardButton {
  text: string;
  callback_data: string;
}

composer.command(['ss', 'setstatus', 'status', 'cs', 'changestatus'], async (ctx) => {
  if (!isSuperUser(ctx.from!.id.toString())) {
    return;
  }

  await ctx.deleteMessage();
  const statuses = Object.values(GroupBuysData.Statuses);
  const keyboard: KeyboardButton[] = statuses!.map(status => ({ text: GroupBuysData.StatusMessages[status], callback_data: `setstatus_${status}` }));
  const splitKeyboard: KeyboardButton[][] = splitMenu(keyboard, 2);

  await ctx.reply('Choose status of groupbuy', Markup.inlineKeyboard(splitKeyboard));
});

export default composer;