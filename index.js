import { Telegraf } from "telegraf";
import { WebSocket } from "ws";
import { CrosstClient, handleCMessage } from "./src/handler/crosst.js";
import 'dotenv/config';
import { loadBotData, log } from "./src/handler/utils.js";
import { handleTMessage } from "./src/handler/telegram.js";

const { BOT_TOKEN, ADMIN_ID, CROSST_PASSWD, CROSST_NICK, CROSST_CHANNEL, GROUP_ID } = process.env;
const bot = new Telegraf(BOT_TOKEN);
const CrosstWs = new WebSocket('wss://ws.crosst.chat:35197');

loadBotData();
bot.on('message', handleTMessage);
bot.launch().catch(console.error);
CrosstWs.onopen = () => {
    CrosstClient.joinChannel(CROSST_CHANNEL, CROSST_NICK, CROSST_PASSWD);
    CrosstClient.sendMessageText('Link Start');
    log('成功连接十字街服务');
}
CrosstWs.addEventListener('message', handleCMessage);
let BOT_NAME = (await bot.telegram.getMe()).username;

export { bot, CrosstWs, ADMIN_ID, CROSST_NICK, CROSST_PASSWD, CROSST_CHANNEL, GROUP_ID, BOT_NAME };
