import { Scenes, Markup } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import db from '../../db/index';
import { initProjectAndGroupbuy } from "../util";
import { replyWithCancelButton } from "../util";
const currentStageName = 'MANUAL_PROJECT_0_URL';
const nextStageName = 'MANUAL_PROJECT_1_NAME';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  initProjectAndGroupbuy(ctx);
  await replyWithCancelButton(ctx, "Let's add a project manually! 🎨\n\n" +
    "First, please enter the <b>project URL</b>:")
});

scene.on('text', async (ctx: KickstarterContext) => {
  const url = ctx.text;

  try {
    await ctx.deleteMessage(ctx.msgId);
  } catch (error) {
    await ctx.replyWithHTML(`<b>Make me an admin first</b>`);
    return ctx.scene.leave();
  }

  if (!url) {
    await replyWithCancelButton(ctx, 'Please provide a valid URL.', {deletePreviousMessage: true})
    return;
  }

  // Check if project already exists
  const project = await db('projects').where('url', url).first();
  if (project) {
    const message = `Project already exists with ID: ${project.id}\n\n` +
      "Would you like to use this project in this group?";
    await replyWithCancelButton(ctx, message, {
      additionalButtons: [
        { text: '✅ Yes, use it', callbackName: 'use_existing' },
      ],
      deletePreviousMessage: true
    });
    ctx.session!.projectId = project.id;
    ctx.session!.foundProject = project;
    return;
  }

  ctx.session!.project!.url = url;
  return ctx.scene.enter(nextStageName);
});

scene.action('use_existing', async (ctx: KickstarterContext) => {
  const project = ctx.session!.foundProject;
  ctx.session!.project = {
    ...project,
    allPledges: typeof project.allPledges === 'string' ? JSON.parse(project.allPledges) : project.allPledges,
    selectedPledge: typeof project.selectedPledge === 'string' ? JSON.parse(project.selectedPledge) : project.selectedPledge,
    files: typeof project.files === 'string' ? JSON.parse(project.files) : project.files,
    tags: typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags
  };

  // Check for missing required fields
  const nameIsMissing = ctx.session!.project!.name;
  const creatorIsMissing = !ctx.session!.project!.creator;
  const pledgeIsMissing = !ctx.session!.project!.selectedPledge;

  const selectedPledge = typeof ctx.session!.project!.selectedPledge === 'string' 
    ? JSON.parse(ctx.session!.project!.selectedPledge) 
    : ctx.session!.project!.selectedPledge;

  const pledgeNameIsMissing = !selectedPledge?.name;
  const pledgePriceIsMissing = !selectedPledge?.price;
  const pledgeIsMissingData = nameIsMissing || 
    creatorIsMissing || 
    pledgeIsMissing || 
    pledgeNameIsMissing || 
    pledgePriceIsMissing;

  if (pledgeIsMissingData) {
    return ctx.scene.enter('USE_EXISTING_PROJECT_1_NAME');
  };

  return ctx.scene.enter('NEW_GROUPBUY_1_CONFIRM');
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene; 