import { Scenes, Markup } from "telegraf";
import { defaultKickstarterActor, apifyClient } from "../../api/apify-client";
import { KickstarterContext } from '../../types/customContext';
import { ApifyKickstarterResponse, TransformedKickstarterResponse, ApifyResponse } from '../../types/specificInterfaces';
import db from '../../db/index';

const currentStageName = 'NEW_GROUPBUY_0_LINK';
const nextStageName = 'NEW_GROUPBUY_1_CONFIRM';

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  ctx.session!.groupbuy = {
    telegramGroupID: ctx.chat!.id.toString(),
    margin: 10,
    minPricePerMember: 0,
    pricePerMember: 999,
    finalPrice: 0,
    status: 'pending',
    messagesID: [],
    projectID: 0
  }

  ctx.session!.project = {
    creator: '',
    name: '',
    url: '',
    hosted: false,
    allPledges: [],
    selectedPledge: {
      name: '',
      price: 999
    },
    latePledgePrice: 999,
    files: [],
    thumbnail: '',
    tags: []
  }
  const nctx = await ctx.replyWithHTML(`Send a <b>link</b>`);

  ctx.session!.messages = {
    toEdit: nctx.message_id.toString(),
    chatID: nctx.chat.id.toString()
  }
});

scene.on('text', async (ctx: KickstarterContext) => {
  const link = ctx.text;
  try {
    await ctx.deleteMessage(ctx.msgId);
  } catch (error) {
    await ctx.replyWithHTML(`<b>Make me an admin first</b>`);
    return ctx.scene.leave();
  }

  // check if project already exists
  const project = await db('projects').where('url', link).first();
  if (project) {
    ctx.reply('Project already exists!');
    return ctx.scene.leave();
  }

  await ctx.telegram.editMessageText(
    parseInt(ctx.session!.messages!.chatID), 
    parseInt(ctx.session!.messages!.toEdit as string),
    undefined,
    `Getting data, standby.`, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      Markup.button.callback('❌ Cancel', 'cancel')
    ])
  });

  const input = { ...defaultKickstarterActor, startUrls: [{ url: link }] };
  const run = await apifyClient.actor("moJRLRc85AitArpNN").call(input);

  try {
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems() as ApifyResponse;

    if (items.length === 0) {
      return ctx.reply("❌ No data found for this link. Please try another.");
    }

    const kickstarterData: ApifyKickstarterResponse = items[0] as ApifyKickstarterResponse;
    const transformedData: TransformedKickstarterResponse = {
      ...kickstarterData,
      rewards: kickstarterData.rewards.map(pledge => ({
        name: pledge.name,
        price: parseInt(pledge.price[0])
      }))
    };
    
    ctx.session!.project!.url = transformedData.url;
    ctx.session!.project!.name = transformedData.projectName;
    ctx.session!.project!.creator = transformedData.creatorName;
    ctx.session!.project!.allPledges = transformedData.rewards;

    return ctx.scene.enter(nextStageName);

  } catch (error) {
    const { message, type, statusCode, clientMethod, path } = error as any;
    console.log({ message, statusCode, clientMethod, type });

    await ctx.reply("❌ Failed to fetch Kickstarter data. Please try again.");
    return ctx.scene.leave();
  }
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene;