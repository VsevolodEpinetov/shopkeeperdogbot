import { Scenes } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import { replyWithCancelButton } from "../util";
import { Pledge } from "../../types/specificInterfaces";
const currentStageName = 'MANUAL_PROJECT_4_PRICE';
const nextStageName = 'NEW_GROUPBUY_1_CONFIRM';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {  
  await replyWithCancelButton(ctx, "Please enter the <b>pledge price</b> (in USD):", {deletePreviousMessage: true}) 
});

scene.on('text', async (ctx: KickstarterContext) => {
  const priceText = ctx.text;
  
  if (!priceText) {
    await replyWithCancelButton(ctx, 'Please provide a valid price.', {deletePreviousMessage: true})
    return;
  }

  const price = parseFloat(priceText);
  if (isNaN(price) || price <= 0) {
    await replyWithCancelButton(ctx, 'Please enter a valid price greater than 0.', {deletePreviousMessage: true})
    return;
  }

  ctx.session!.project!.selectedPledge = {
    name: (ctx.session!.project!.selectedPledge as Pledge).name,
    price: price
  } as Pledge;
  ctx.session!.project!.allPledges = [ctx.session!.project!.selectedPledge as Pledge];

  ctx.session!.messages = undefined;

  return ctx.scene.enter(nextStageName);
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene; 