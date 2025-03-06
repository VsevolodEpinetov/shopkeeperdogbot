import { Composer } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { getAllFilesFromFolder } from '../util';
import { KickstarterContext } from '../types/customContext';

const groupbuyComposer = new Composer<KickstarterContext>();

const actionsPath = path.join(__dirname, './actions');
const commandsPath = path.join(__dirname, './commands');

if (fs.existsSync(actionsPath)) {
  getAllFilesFromFolder(actionsPath)
    .forEach((file: string) => {
      const action = require(file).default;
      if (action) groupbuyComposer.use(action);
    });
}

if (fs.existsSync(commandsPath)) {
  getAllFilesFromFolder(commandsPath)
    .forEach((file: string) => {
      console.log('Loading command file:', file);
      const command = require(file).default;
      if (command) {
        console.log('Command loaded successfully');
        groupbuyComposer.use(command);
      }
    });
}

export default groupbuyComposer;
