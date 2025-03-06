import { Composer } from 'telegraf';
import { KickstarterContext } from '../../types/customContext';
import { isSuperUser } from '../../util';
import db from '../../db/index';

const composer = new Composer<KickstarterContext>();

composer.command('reset', async (ctx) => {
    if (!isSuperUser(ctx.from!.id.toString())) {
        return;
    }
    const telegramGroupID = ctx.chat!.id.toString();

    // remove row from groupbuys table
    await db('groupbuys').where('telegramGroupID', telegramGroupID).delete();

    ctx.reply('Groupbuy reset');
});

export default composer;