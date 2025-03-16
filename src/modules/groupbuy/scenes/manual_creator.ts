import { Scenes } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import { replyWithCancelButton } from "../util";

const currentStageName = 'MANUAL_PROJECT_2_CREATOR';
const nextStageName = 'MANUAL_PROJECT_3_PLEDGE';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  await replyWithCancelButton(ctx, "Please enter the <b>creator name</b>:", {deletePreviousMessage: true});
});

scene.on('text', async (ctx: KickstarterContext) => {
  const creatorName = ctx.text;

  if (!creatorName) {
    await replyWithCancelButton(ctx, 'Please provide a valid creator name.', {deletePreviousMessage: true})
    return;
  }

  ctx.session!.project!.creator = creatorName;
  
  return ctx.scene.enter(nextStageName);
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene; 