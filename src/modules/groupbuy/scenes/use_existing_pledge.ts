import { Scenes, Markup } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import { updateMessage } from "../../util";
import db from "../../db";
import { Pledge } from "../../types/specificInterfaces";

const currentStageName = 'USE_EXISTING_PROJECT_3_PLEDGE';
const nextStageName = 'USE_EXISTING_PROJECT_4_PRICE';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  await updateMessage(ctx);

  const selectedPledge: Pledge = typeof ctx.session!.project!.selectedPledge === 'string' 
    ? JSON.parse(ctx.session!.project!.selectedPledge) 
    : ctx.session!.project!.selectedPledge;

  const message = await ctx.replyWithHTML(
    `Stored pledge name: ${selectedPledge?.name || 'None'}. To change the pledge name send it now`,
    Markup.inlineKeyboard([
      Markup.button.callback('✅ Use it', 'use_existing'),
      Markup.button.callback('❌ Cancel', 'cancel')
    ])
  );

  ctx.session!.messages!.toDelete = message.message_id.toString();
});

scene.on('text', async (ctx: KickstarterContext) => {
  const pledgeName = ctx.text;

  if (!pledgeName) {
    await ctx.reply('Please provide a valid pledge name.');
    return;
  }

  try {
    await ctx.deleteMessage(ctx.msgId);
  } catch (error) {
    await ctx.replyWithHTML(`<b>Make me an admin first</b>`);
    return ctx.scene.leave();
  }

  // Initialize selectedPledge if it doesn't exist
  if (!ctx.session!.project!.selectedPledge) {
    ctx.session!.project!.selectedPledge = {
      name: '',
      price: 0
    };
  }

  // Update the pledge name
  if (typeof ctx.session!.project!.selectedPledge === 'string') {
    ctx.session!.project!.selectedPledge = JSON.parse(ctx.session!.project!.selectedPledge);
  }
  (ctx.session!.project!.selectedPledge as Pledge).name = pledgeName;

  return ctx.scene.enter(nextStageName);
});

scene.action('use_existing', async (ctx: KickstarterContext) => {
  const selectedPledge = typeof ctx.session!.project!.selectedPledge === 'string' 
    ? JSON.parse(ctx.session!.project!.selectedPledge) 
    : ctx.session!.project!.selectedPledge;

  if (!selectedPledge?.name) {
    ctx.reply('Pledge name still does NOT exist. Send a pledge name right there');
    return;
  }

  return ctx.scene.enter(nextStageName);
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene; 