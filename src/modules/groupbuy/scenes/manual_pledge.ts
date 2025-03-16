import { Scenes } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import { replyWithCancelButton } from "../util";
import { Pledge } from "../../types/specificInterfaces";
const currentStageName = 'MANUAL_PROJECT_3_PLEDGE';
const nextStageName = 'MANUAL_PROJECT_4_PRICE';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  await replyWithCancelButton(ctx, "Please enter the <b>pledge name</b>:", {deletePreviousMessage: true})
});

scene.on('text', async (ctx: KickstarterContext) => {
  const pledgeName = ctx.text;
  
  if (!pledgeName) {
    await replyWithCancelButton(ctx, 'Please provide a valid pledge name.', {deletePreviousMessage: true})
    return;
  }
  
  ctx.session!.project!.selectedPledge = {
    name: pledgeName,
    price: 0
  } as Pledge;
  return ctx.scene.enter(nextStageName);
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene; 