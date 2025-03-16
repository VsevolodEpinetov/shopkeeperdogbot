import { Scenes, Markup } from "telegraf";
import db from '../../db/index';
import { generateGroupBuyMessage, adjustMessage } from "../util";
import { KickstarterContext } from "../../types/customContext";
import { Pledge, Project, Participant, GroupBuy } from "../../types/specificInterfaces";
import { GroupBuysData } from "../../settings";

const currentStageName = "NEW_GROUPBUY_1_CONFIRM";
const scene = new Scenes.BaseScene<KickstarterContext>(currentStageName);

scene.enter(async (ctx: KickstarterContext) => {
  const allPledges = ctx.session!.project!.allPledges as Pledge[];
  ctx.session!.project!.selectedPledge = ctx.session!.project!.selectedPledge || allPledges[0];
  ctx.session!.groupbuy!.finalPrice = (ctx.session!.project!.selectedPledge as Pledge).price;
  await updateMessage(ctx);
});

async function updateMessage(ctx: KickstarterContext) {
  const projectData: Project = ctx.session!.project!;
  const pledgeButtons = (projectData.allPledges as Pledge[]).map((pledge: Pledge, index: number) => {
    const pledgeIsSelected = pledge.name === (projectData.selectedPledge as Pledge).name;
    const buttonName = pledgeIsSelected ? `✅ ${pledge.name} - €${pledge.price}` : `${pledge.name} - €${pledge.price}`;
    return [ Markup.button.callback(buttonName, `pledge_${index}`) ]
  });

  const message = `
✅ <b>Kickstarter Project Found!</b>
🔗 <b>Link:</b> <a href="${projectData.url}">${projectData.name}</a>
👤 <b>Creator:</b> ${projectData.creator}

🎁 <b>Select the correct pledge tier:</b>
${projectData.selectedPledge ? `${(projectData.selectedPledge as Pledge).name} - €${(projectData.selectedPledge as Pledge).price}` : "⚠️ Not selected yet"}
    `;

  const buttons = [
    ...pledgeButtons,
    [Markup.button.callback('Confirm', 'confirm')]
  ]

  if (ctx.session!.messages?.toEdit) {
    if (ctx.session!.messages!.toEdit.length > 2) {
      await ctx.telegram.editMessageText(
        ctx.session!.messages!.chatID,
        parseInt(ctx.session!.messages!.toEdit),
        undefined,
        message,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(buttons)
        });
    } else {
      const sentMessage = await ctx.replyWithHTML(message, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons)
      })

      ctx.session!.messages!.chatID = sentMessage.chat.id.toString();
      ctx.session!.messages!.toEdit = sentMessage.message_id.toString();
    }
  } else {
    const sentMessage = await ctx.replyWithHTML(message, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons)
    })

    ctx.session!.messages = {
      chatID: sentMessage.chat.id.toString(),
      toEdit: sentMessage.message_id.toString()
    }
  }
}

scene.action(/^pledge_(\d+)$/, async (ctx: KickstarterContext) => {
  if (!('data' in ctx.callbackQuery!)) return;
  const data = ctx.callbackQuery!.data;
  const pledgeIndex = parseInt(data.split('_')[1]);
  const allPledges = ctx.session!.project!.allPledges as Pledge[];
  ctx.session!.project!.selectedPledge = allPledges[pledgeIndex];
  ctx.session!.groupbuy!.finalPrice = (ctx.session!.project!.selectedPledge as Pledge).price;

  await ctx.answerCbQuery();
  await updateMessage(ctx);
});

scene.action("confirm", async (ctx: KickstarterContext) => {
  try {
    await ctx.telegram.deleteMessage(
      parseInt(ctx.session!.messages!.chatID),
      parseInt(ctx.session!.messages!.toEdit as string)
    );
    const username = ctx.from!.username || ctx.from!.first_name;

    const project: Project = {
      creator: ctx.session!.project!.creator,
      name: ctx.session!.project!.name,
      url: ctx.session!.project!.url,
      hosted: true,
      allPledges: ctx.session!.project!.allPledges,
      selectedPledge: ctx.session!.project!.selectedPledge,
      latePledgePrice: 0,
      files: [],
      thumbnail: '',
      tags: []
    }

    const projectDB: Project = {
      creator: ctx.session!.project!.creator,
      name: ctx.session!.project!.name,
      url: ctx.session!.project!.url,
      hosted: true,
      allPledges: JSON.stringify(ctx.session!.project!.allPledges),
      selectedPledge: JSON.stringify(ctx.session!.project!.selectedPledge),
      latePledgePrice: 0,
      files: JSON.stringify([]),
      thumbnail: '',
      tags: JSON.stringify([])
    }

    const projectInsertResponse = await db('projects').insert(projectDB).returning('id');

    const participants: Participant[] = [];

    const messageParts = await generateGroupBuyMessage(ctx.session!.groupbuy!, project, participants);

    if (messageParts.length > GroupBuysData.AmountOfReservedMessages) {
      ctx.reply('@send_dog_pics the group has reached the maximum amount of reserved messages');
      return ctx.scene.leave();
    }

    const newMessagesIDs: string[] = await adjustMessage(ctx, messageParts, 'pending', 'send', ctx.session!.groupbuy!.telegramGroupID);

    const groupbuyDB: GroupBuy = {
      telegramGroupID: ctx.session!.groupbuy!.telegramGroupID.toString(),
      margin: parseFloat(ctx.session!.groupbuy!.margin.toString()),
      minPricePerMember: 0,
      pricePerMember: parseFloat(ctx.session!.groupbuy!.finalPrice.toString()),
      finalPrice: parseFloat(ctx.session!.groupbuy!.finalPrice.toString()),
      status: 'pending',
      messagesID: JSON.stringify(newMessagesIDs),
      projectID: projectInsertResponse[0].id
    }

    const [groupbuyID] = await db('groupbuys').insert(groupbuyDB).returning(['telegramGroupID']);

    await db('users').insert({
      telegramID: ctx.callbackQuery!.from.id,
      telegramUsername: username,
      telegramFirstName: ctx.callbackQuery!.from.first_name,
      lastSeenAt: new Date(),
    }).onConflict('telegramID').merge();

    const telegramGroupID = groupbuyID.telegramGroupID;
    const telegramID = ctx.from!.id.toString();

    await db('groupbuy_participants').insert({
      telegramGroupID: telegramGroupID,
      telegramID: telegramID,
      paid: true
    });

    return ctx.scene.leave();
  }


  catch (error) {
    console.error("Error confirming groupbuy:", error);
    ctx.reply("❌ Failed to create Groupbuy. Please try again.");
  }
});

export default scene;
