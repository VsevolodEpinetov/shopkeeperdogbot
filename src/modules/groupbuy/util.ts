import knex from "knex";
import { GroupBuysData, TelegramData } from "../settings";
import { KickstarterContext } from "../types/customContext";
import { GroupBuy, Project, Participant } from "../types/specificInterfaces";
import { Markup } from "telegraf";
import db from "../db";

const generateGroupBuyMessage = async (groupbuy: GroupBuy, project: Project, participants: Participant[]): Promise<string[]> => {
  const status: string = groupbuy.status;
  const totalCost: number = JSON.parse(project.selectedPledge as string).price;
  const pricePerMember: number = Math.ceil(totalCost / participants.length);

  // Get all balances and users in one query
  const balances = await db('balances')
    .whereIn('telegramID', participants.map(p => p.telegramID))
    .select('telegramID', 'current');

  const users = await db('users')
    .whereIn('telegramID', participants.map(p => p.telegramID))
    .select('*');

  const balanceMap = new Map(balances.map(b => [b.telegramID, b.balance || 0]));
  const userMap = new Map(users.map(u => [u.telegramID, u]));

  let message: string = '';
  message += `<b>${project.creator}</b>\n`;
  message += `<i>${project.name}</i>\n\n`;
  message += `🔗 <b>Link:</b> ${project.url}\n`;
  message += `💰 <b>Total Cost:</b> ${totalCost}€\n\n`;


  message += `<b>Status:</b> ${GroupBuysData.StatusMessages[status]}\n\n`;

  message += `<b>Participants List:</b>\n`;

  let paid = 0, notPaid = 0;

  participants.forEach((participant, index) => {
    const userData = userMap.get(participant.telegramID);
    const balance = balanceMap.get(participant.telegramID) || undefined;
    const name = userData?.telegramUsername ? 
      `@${userData.telegramUsername}` : 
      `${userData?.telegramFirstName || ''} ${userData?.telegramLastName || ''}`.trim();

    const balanceStatus = balance && (balance >= pricePerMember ? "💰 Tab covers" : "❌ Tab won't cover");
    const paidStatus = balanceStatus || (participant.paid ? "💰 Paid" : "❌ Not Paid");

    if (paidStatus.indexOf('❌') < 0) {
      paid++;
    } else {
      notPaid++;
    }

    message += `${index + 1}. <b>${name}</b> - ${paidStatus}\n`;
  });

  if (status === 'payment') {
    message += `\n💶 <b>FINAL PRICE PER-MEMBER:</b> ${pricePerMember}€\n`;
    message += `\n🏦 <b>Balance Summary:</b>\n`;
    message += `✅ <b>Paid:</b> ${paid} users\n`;
    message += `❌ <b>Not Paid:</b> ${notPaid} users\n`;
  }

  if (status === 'open') {
    message += `\n📩 <b>How to Join:</b>\n`;
    message += `Click the button below to participate! ⬇️`;
  }

  return splitMessage(message);
};

const splitMessage = (message: string) => {
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

const adjustMessage = async (ctx: KickstarterContext, messageParts: string[], status: string, action: string, chatID: string, messagesID?: string[] | undefined): Promise<string[]> => {
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

const updateGroupBuyMessages = async (ctx: KickstarterContext, groupbuy: GroupBuy, project: Project, participants: Participant[]) => {
  if (!groupbuy || !project || !participants) {
    console.log(groupbuy, project, participants);
    return ctx.reply('Groupbuy not found');
  }

  const messagesID: string[] = groupbuy.messagesID as string[];
  const messageParts: string[] = await generateGroupBuyMessage(groupbuy, project, participants);

  adjustMessage(ctx, messageParts, groupbuy.status, 'edit', groupbuy.telegramGroupID, messagesID);
}

export { generateGroupBuyMessage, splitMessage, updateGroupBuyMessages, adjustMessage };
