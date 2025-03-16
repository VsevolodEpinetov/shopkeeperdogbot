import knex from "knex";
import { GroupBuysData, TelegramData } from "../settings";
import { KickstarterContext } from "../types/customContext";
import { GroupBuy, Project, Participant } from "../types/specificInterfaces";
import { Markup } from "telegraf";
import db from "../db";

export const generateGroupBuyMessage = async (groupbuy: GroupBuy, project: Project, participants: Participant[]): Promise<string[]> => {
  const status: string = groupbuy.status;
  const totalCost: number = typeof project.selectedPledge == 'string' ? JSON.parse(project.selectedPledge).price : project.selectedPledge.price;
  const pricePerMember: number = Math.ceil(totalCost / participants.length);

  // Get all balances and users in one query
  const balances = await db('balances')
    .whereIn('telegramID', participants.map(p => p.telegramID))
    .select('telegramID', 'current');

  const users = await db('users')
    .whereIn('telegramID', participants.map(p => p.telegramID))
    .select('*');

  const unpaidExpectedPayments = await db('expected_payments')
    .where('telegramGroupID', groupbuy.telegramGroupID)
    .where('completed', false)
    .select('*');

  const balanceMap = new Map(balances.map(b => [b.telegramID, b.balance || 0]));
  const userMap = new Map(users.map(u => [u.telegramID, u]));

  let message: string = '';
  message += `<b>${project.creator}</b>\n`;
  message += `<i>${project.name}</i>\n\n`;
  message += `🔗 <b>Link:</b> ${project.url}\n`;
  message += `💰 <b>Total Cost:</b> ${totalCost}€\n`;

  if (status === 'open') {
    message += `<b>Current Price Per Member:</b> ${pricePerMember}€\n`;
  }

  message += `\n<b>Status:</b> ${GroupBuysData.StatusMessages[status]}\n\n`;
  message += `<b>Participants List:</b>\n`;

  let paid = 0, notPaid = 0;

  participants.forEach((participant, index) => {
    const userData = userMap.get(participant.telegramID);
    const balance = balanceMap.get(participant.telegramID) || undefined;
    const name = userData?.telegramUsername ?
      `@${userData.telegramUsername}` :
      `${userData?.telegramFirstName || ''} ${userData?.telegramLastName || ''}`.trim();

    const paymentID = unpaidExpectedPayments.find(payment => payment.telegramID === participant.telegramID)?.id;

    const balanceStatus = balance && (balance >= pricePerMember ? "💰 Tab covers" : "❌ Tab won't cover");
    const paidStatus = balanceStatus || (participant.paid ? "💰 Paid" : "❌ Not Paid");


    if (paidStatus.indexOf('❌') < 0) {
      paid++;
      message += `${index + 1}. <b>${name}</b> - ${paidStatus}\n`;
    } else {
      notPaid++;
      if (status === 'payment') {
        message += `${index + 1}. <b>${name}</b> - ${paidStatus} (<code>${paymentID}</code>)\n`;
      } else {
        message += `${index + 1}. <b>${name}</b> - ${paidStatus}\n`;
      }
    }

    
  });

  if (status === 'payment') {
    message += `\n💶 <b>FINAL PRICE PER-MEMBER:</b> ${pricePerMember}€\n`;
    message += `\n🏦 <b>Balance Summary:</b>\n`;
    message += `✅ <b>Paid:</b> ${paid} users\n`;
    message += `❌ <b>Not Paid:</b> ${notPaid} users\n`;
  }

  const joiners = await db('groupbuy_joiners').where('telegramGroupID', groupbuy.telegramGroupID).select('*');
  const joinersCount = joiners.length;
  if (joinersCount > 0) {
    message += `\n👥 <b>Did not join yet (${joinersCount}):</b>\n`;
    joiners.forEach((joiner, index) => {
      message += `${index + 1}. <b>${joiner.telegramUsername}</b>\n`;
    });
  }

  if (status === 'open') {
    message += `\n📩 <b>How to Join:</b>\n`;
    message += `Click the button below or say 'add me' to participate! ⬇️`;
  }

  return splitMessage(message);
};

export const sendPaymentInstructions = async (ctx: KickstarterContext, pricePerMember: number) => {
  const priceWithFees = pricePerMember * 1.029 + 0.30;
  const message = `🎉 <b>The project has been funded and the pledge is paid!</b>

💰 <b>Payment Instructions:</b>
Please send <b>€${pricePerMember}</b> via PayPal. Choose the correct option:
• Friends & Family: €${pricePerMember}
• Goods & Services: €${priceWithFees}

⚠️ <b>IMPORTANT:</b>
• Use Friends & Family option to avoid fees
• The received amount must be exactly €${pricePerMember}
• Use <a href="https://www.omnicalculator.com/finance/paypal-fee">this tool</a> to calculate PayPal fees if needed

📝 <b>Payment Comment (REQUIRED):</b>
Include these details in your payment comment:
1. Payment ID - you can find it in the groupbuy message. If you can't find it, press the button "What is my number?"

Example comment:
<code>KS293</code>

Nothing else is needed.

💳 PayPal: https://www.paypal.me/ins0mn1

❗️ Payments without proper comments will be rejected
❗️ Double check the amount before sending`;

  return ctx.replyWithHTML(message);
};

export const splitMessage = (message: string) => {
  if (message.length <= TelegramData.Limits.MessageCharacters) {
    return [message]; // No split needed
  }

  const messages = [];
  let currentMessage = "";

  const lines = message.split("\n");

  lines.forEach(line => {
    if ((currentMessage + "\n" + line).length > TelegramData.Limits.MessageCharacters) {
      messages.push(currentMessage);
      currentMessage = line;
    } else {
      currentMessage += (currentMessage ? "\n" : "") + line;
    }
  });

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
};

export const adjustMessage = async (ctx: KickstarterContext, messageParts: string[], status: string, action: string, chatID: string, messagesID?: string[] | undefined): Promise<string[]> => {
  const newMessagesIDs: string[] = [];

  const sendOrEditMessage = async (index: number) => {
    const isLastMessage = index === (messageParts.length - 1);
    const isOpen = status === 'open';
    const isPayment = status === 'payment';
    const addMeButton = Markup.button.callback('🔘 Add me', 'add_me');
    const whatIsMyNumberButton = Markup.button.callback('🔘 What is my number?', 'what_is_my_number');

    const buttons = isOpen ? [addMeButton] : isPayment ? [whatIsMyNumberButton] : [];
    const options = {
      parse_mode: "HTML" as const,
      ...(isLastMessage && {
        ...Markup.inlineKeyboard([
          buttons
        ])
      })
    };

    if (action === 'edit') {
      try {
        await ctx.telegram.editMessageText(
          chatID,
          parseInt(messagesID![index]),
          undefined,
          messageParts[index],
          options
        );
      } catch (error: any) {
        if (error.code !== 400) {
          throw error;
        }
      }
    } else {
      const sentMessage = await ctx.telegram.sendMessage(
        chatID,
        messageParts[index] || 'Reserved message',
        options
      );
      newMessagesIDs.push(sentMessage.message_id.toString());
    }
  };

  for (let i = 0; i < GroupBuysData.AmountOfReservedMessages; i++) {
    if (action === 'edit' && !messageParts[i]) continue;
    await sendOrEditMessage(i);
  }

  return action === 'edit' ? messagesID! : newMessagesIDs;
};

export const updateGroupBuyMessages = async (ctx: KickstarterContext, groupbuy: GroupBuy, project: Project, participants: Participant[]) => {
  if (!groupbuy || !project || !participants) {
    console.log(groupbuy, project, participants);
    return ctx.reply('Groupbuy not found');
  }

  const messagesID: string[] = groupbuy.messagesID as string[];
  const messageParts: string[] = await generateGroupBuyMessage(groupbuy, project, participants);

  adjustMessage(ctx, messageParts, groupbuy.status, 'edit', groupbuy.telegramGroupID, messagesID);
}

export const initProject = (): Project => ({
  creator: '',
  name: '',
  url: '',
  hosted: false,
  allPledges: [],
  selectedPledge: {
    name: '',
    price: 0
  },
  latePledgePrice: 0,
  files: [],
  thumbnail: '',
  tags: []
});

export const initGroupbuy = (telegramGroupId: string, price: number = 0): GroupBuy => ({
  telegramGroupID: telegramGroupId,
  margin: 10,
  minPricePerMember: 0,
  pricePerMember: price || 999,
  finalPrice: price || 0,
  status: 'pending',
  messagesID: [],
  projectID: 0
});

export const initProjectAndGroupbuy = (ctx: KickstarterContext) => {
  ctx.session!.project = initProject();
  ctx.session!.groupbuy = initGroupbuy(ctx.chat!.id.toString());
};

export const replyWithCancelButton = async (ctx: KickstarterContext, text: string, 
  { editable = false, 
    additionalButtons = [],
    deletePreviousMessage = false
  }: { 
    editable?: boolean,
    additionalButtons?: { text: string, callbackName: string }[],
    deletePreviousMessage?: boolean
  } = {}) => {

  if (deletePreviousMessage) {
    try {
      await ctx.telegram.deleteMessage(parseInt(ctx.session!.messages!.chatID!), parseInt(ctx.session!.messages!.toDelete!));
    } catch (error) {
      console.log(error);
    }
  }

  const buttons = [...additionalButtons.map(button => Markup.button.callback(button.text, button.callbackName)), Markup.button.callback('❌ Cancel', 'cancel')]
  const message = await ctx.replyWithHTML(
    text,
    Markup.inlineKeyboard([
      ...buttons,
    ])
  );

  if (!ctx.session!.messages) {
    ctx.session!.messages = {
      chatID: message.chat.id.toString()
    };
  }

  if (editable) {
    ctx.session!.messages!.toEdit = message.message_id.toString();
  } else {
    ctx.session!.messages!.toDelete = message.message_id.toString();
  }

  return message;
};
