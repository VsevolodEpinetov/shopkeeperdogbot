import { Scenes, Markup } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import { updateMessage } from "../../util";
import { Pledge } from "../../types/specificInterfaces";

const currentStageName = 'USE_EXISTING_PROJECT_4_PRICE';
const nextStageName = 'NEW_GROUPBUY_1_CONFIRM';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  await updateMessage(ctx);

  const selectedPledge: Pledge = typeof ctx.session!.project!.selectedPledge === 'string' 
    ? JSON.parse(ctx.session!.project!.selectedPledge) 
    : ctx.session!.project!.selectedPledge;

  const message = await ctx.replyWithHTML(
    `Stored pledge price: ${selectedPledge?.price || 'None'}. To change the price send it now`,
    Markup.inlineKeyboard([
      Markup.button.callback('✅ Use it', 'use_existing'),
      Markup.button.callback('❌ Cancel', 'cancel')
    ])
  );

  ctx.session!.messages!.toDelete = message.message_id.toString();
});

scene.on('text', async (ctx: KickstarterContext) => {
  const priceText = ctx.text;

  if (!priceText) {
    await ctx.reply('Please provide a valid price.');
    return;
  }

  try {
    await ctx.deleteMessage(ctx.msgId);
  } catch (error) {
    await ctx.replyWithHTML(`<b>Make me an admin first</b>`);
    return ctx.scene.leave();
  }

  const price = parseFloat(priceText);
  if (isNaN(price) || price <= 0) {
    await ctx.reply('Please enter a valid price greater than 0.');
    return;
  }

  // Initialize selectedPledge if it doesn't exist
  if (!ctx.session!.project!.selectedPledge) {
    ctx.session!.project!.selectedPledge = {
      name: '',
      price: 0
    };
  }

  // Update the pledge price
  if (typeof ctx.session!.project!.selectedPledge === 'string') {
    ctx.session!.project!.selectedPledge = JSON.parse(ctx.session!.project!.selectedPledge);
  }
  (ctx.session!.project!.selectedPledge as Pledge).price = price;
  ctx.session!.project!.latePledgePrice = price;
  ctx.session!.project!.allPledges = [ctx.session!.project!.selectedPledge as Pledge];

  // Initialize groupbuy data
  ctx.session!.groupbuy = {
    telegramGroupID: ctx.chat!.id.toString(),
    margin: 10,
    minPricePerMember: 0,
    pricePerMember: price,
    finalPrice: price,
    status: 'pending',
    messagesID: [],
    projectID: 0
  };

  return ctx.scene.enter(nextStageName);
});

scene.action('use_existing', async (ctx: KickstarterContext) => {
  const selectedPledge = typeof ctx.session!.project!.selectedPledge === 'string' 
    ? JSON.parse(ctx.session!.project!.selectedPledge) 
    : ctx.session!.project!.selectedPledge;

  if (!selectedPledge?.price) {
    ctx.reply('Price still does NOT exist. Send a price right there');
    return;
  }

  const price = selectedPledge.price;

  return ctx.scene.enter(nextStageName);
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene; 