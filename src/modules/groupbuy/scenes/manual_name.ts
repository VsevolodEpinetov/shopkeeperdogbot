import { Scenes } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import { replyWithCancelButton } from "../util";

const currentStageName = 'MANUAL_PROJECT_1_NAME';
const nextStageName = 'MANUAL_PROJECT_2_CREATOR';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  await replyWithCancelButton(ctx, "Please enter the <b>project name</b>:", {deletePreviousMessage: true})
});

scene.on('text', async (ctx: KickstarterContext) => {
  const projectName = ctx.text;

  if (!projectName) {
    await replyWithCancelButton(ctx, 'Please provide a valid project name.', {deletePreviousMessage: true})
    return;
  }
  
  ctx.session!.project!.name = projectName;
  return ctx.scene.enter(nextStageName);
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene; 