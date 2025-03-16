import axios from "axios";
import { Scenes, Markup } from "telegraf";
import { KickstarterContext } from '../../types/customContext';
import db from '../../db/index';
import { initProjectAndGroupbuy, replyWithCancelButton } from "../util";

const currentStageName = 'NEW_GROUPBUY_0_LINK';
const nextStageName = 'NEW_GROUPBUY_1_CONFIRM';

interface ZyteResponse {
  title: string;
  creator: string;
  creatorURL: string;
  mainImage: string;
  pledges: Array<{
    name: string;
    price: number;
  }>;
  until: string;
}

const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  initProjectAndGroupbuy(ctx);
  await replyWithCancelButton(ctx, `Send a <b>link</b>`, {additionalButtons: [{text: '🎨 Manual', callbackName: 'manual'}]});
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


  await ctx.telegram.deleteMessage(
    parseInt(ctx.session!.messages!.chatID), 
    parseInt(ctx.session!.messages!.toDelete as string)
  );

  await replyWithCancelButton(ctx, `Getting data, standby 🕐`, {editable: true});

  const clocks = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];
  let clockIndex = 1;

  const updateClock = () => {
    ctx.telegram.editMessageText(
      parseInt(ctx.session!.messages!.chatID),
      parseInt(ctx.session!.messages!.toEdit as string),
      undefined,
      `Getting data, standby ${clocks[clockIndex]}`
    );
    clockIndex = (clockIndex + 1) % clocks.length;
  };

  const interval = setInterval(updateClock, 2000);


  
  try {
    const response = await axios.post( 
      "https://api.zyte.com/v1/extract",
      {
        url: link,
        browserHtml: true,
        product: true,
        productOptions: {
          extractFrom: "browserHtml",
          ai: true
        },
        customAttributes: {
          creator: {
            description: "name of the creator",
            type: "string"
          },
          creatorURL: {
            description: "url to the creator's profile page",
            type: "string"
          },
          mainImage: {
            description: "url of the main image",
            type: "string"
          },
          pledges: {
            description: "all available pledges",
            items: {
              properties: {
                name: {
                  description: "name of the pledge",
                  type: "string"
                },
                price: {
                  description: "price of the pledge",
                  type: "number"
                }
              },
              type: "object"
            },
            type: "array"
          },
          title: {
            description: "project title",
            type: "string"
          },
          until: {
            description: "date in format DD-MM-YYYY when the project expires",
            type: "string"
          }
        }
      },
      {
        auth: {
          username: process.env.ZYTE_API_KEY || ''
        }
      }
    );
    
    clearInterval(interval);
    const data = response.data!.customAttributes!.values;
    
    if (!data) {
      return ctx.reply("❌ No data found for this link. Please try another.");
    }

    ctx.session!.project!.url = link;
    ctx.session!.project!.name = data.title;
    ctx.session!.project!.creator = data.creator;
    ctx.session!.project!.allPledges = data.pledges;

    return ctx.scene.enter(nextStageName);

  } catch (error) {
    console.error("Failed to fetch Kickstarter data:", error);
    await ctx.reply("❌ Failed to fetch Kickstarter data. Please try again.");
    return ctx.scene.leave();
  }
});

scene.action('manual', async (ctx: KickstarterContext) => {
  return ctx.scene.enter('MANUAL_PROJECT_0_NAME');
});

scene.action('cancel', async (ctx: KickstarterContext) => {
  await ctx.replyWithHTML('Cancelling the operation.');
  return ctx.scene.leave();
});

export default scene;