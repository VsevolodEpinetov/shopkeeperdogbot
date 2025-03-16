import { Scenes, Markup } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import { updateMessage } from "../../util";
import db from "../../db";

const currentStageName = 'USE_EXISTING_PROJECT_2_CREATOR';
const nextStageName = 'USE_EXISTING_PROJECT_3_PLEDGE';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  await updateMessage(ctx);

  const message = await ctx.replyWithHTML(
    `Stored creator name: ${ctx.session!.project!.creator}. To change the creator send it now`,
    Markup.inlineKeyboard([
      Markup.button.callback('✅ Use it', 'use_existing'),
      Markup.button.callback('❌ Cancel', 'cancel')
    ])
  );

  ctx.session!.messages!.toDelete = message.message_id.toString();
});

scene.on('text', async (ctx: KickstarterContext) => {
  const creatorName = ctx.text;

  if (!creatorName) {
    await ctx.reply('Please provide a valid creator name.');
    return;
  }

  try {
    await ctx.deleteMessage(ctx.msgId);
  } catch (error) {
    await ctx.replyWithHTML(`<b>Make me an admin first</b>`);
    return ctx.scene.leave();
  }

  ctx.session!.project!.creator = creatorName;

  return ctx.scene.enter(nextStageName);
});

scene.action('use_existing', async (ctx: KickstarterContext) => {
  if (!ctx.session!.project!.creator) {
    ctx.reply('Creator still does NOT exist. Send a creator name right there');
    return;
  }

  return ctx.scene.enter(nextStageName);
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene;
