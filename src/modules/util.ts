import fs from 'fs';
import path from 'path';
import { TelegramData } from './settings';
import { CustomContext } from './types/customContext';
import { KeyboardButton } from './types/generalInterfaces';

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function splitMenu(menu: KeyboardButton[], rowSize = 5): KeyboardButton[][] {
  const result: KeyboardButton[][] = [];

  if (menu.length > rowSize) {
    for (let i = 0; i < menu.length; i += rowSize) {
      result.push(menu.slice(i, i + rowSize));
    }
  } else {
    result.push(menu);
  }

  return result;
}

function isSuperUser (userId: string) :boolean {
  if (userId == TelegramData.ChatsIDs.Epinetov || userId == TelegramData.ChatsIDs.Ann) {
    return true;
  } else {
    return false;
  }
}


function getAllFilesFromFolder (dir: string) :string[] {
  const files = fs.readdirSync(dir);
  let allFiles:string[] = [];

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      allFiles = allFiles.concat(getAllFilesFromFolder(fullPath));  // Рекурсивно проходим по подпапкам
    } else {
      allFiles.push(fullPath);  // Добавляем путь к файлу
    }
  });

  return allFiles;
}

function hideMenu (ctx: CustomContext) {
  try {
    ctx.editMessageReplyMarkup({
      inline_keyboard: []
    });
  }
  catch (err) { }
}

function getRandomInt (min: number, max: number) :number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isAdmin (telegramUserID: string) :boolean {
  const isAnAdmin = telegramUserID == TelegramData.ChatsIDs.Epinetov;

  return isAnAdmin;
}


function getCommandParameter (messageText: string) :string {
  return messageText.split(/ +/)[1];
}

export {
  splitMenu,
  getAllFilesFromFolder,
  hideMenu,
  sleep,
  getRandomInt,
  isAdmin,
  getCommandParameter,
  isSuperUser,
}
