import { Telegraf } from "telegraf";
import { WebSocket } from "ws";
import { CrosstClient } from "./src/handler/crosst.js";
import {loadBotData, log } from "./src/handler/utils.js";
import { TelegramClient } from "./src/handler/telegram.js";
import 'dotenv/config';

const { BOT_TOKEN, ADMIN_ID, CROSST_PASSWD, CROSST_NICK, CROSST_CHANNEL, GROUP_ID, LANGUAGE } = process.env;
const bot = new Telegraf(BOT_TOKEN);
const CrosstWs = new WebSocket('wss://ws.crosst.chat:35197');

loadBotData();
bot.on('message', TelegramClient.handleMessage);
bot.launch().catch(console.error);
CrosstWs.onopen = () => {
    CrosstClient.joinChannel(CROSST_CHANNEL, CROSST_NICK, CROSST_PASSWD);
    CrosstClient.sendMessageText('Link start!');
    log('成功连接十字街服务');
}
CrosstWs.addEventListener('message', CrosstClient.handleMessage);
let BOT_NAME = (await bot.telegram.getMe()).username;

export { bot, CrosstWs, ADMIN_ID, CROSST_NICK, CROSST_PASSWD, CROSST_CHANNEL, GROUP_ID, BOT_NAME, LANGUAGE };
