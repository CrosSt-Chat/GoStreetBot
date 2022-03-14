import { bot } from "../../index.js";
import { GROUP_ID } from "../../index.js";
import { checkCData, log, saveBotData } from "./utils.js";
import { CrosstClient } from "./crosst.js";

export async function handleTMessage(ctx) {
    let msg = ctx.message;
    CrosstClient.syncMessage(msg);
}

export class TelegramClient {
    static async syncMessage(data) {
        let { nick, text, trip } = data;
        text = `${nick} [${trip}]:\n${text}`;
        checkCData(data);
        // Telegram 的 Markdown parse 方法和十字街的不一样，todo 自己实现
        try {
            await bot.telegram.sendMessage(GROUP_ID, text);
            saveBotData();
        }
        catch (e) {
            log(`向 Telegram 同步消息时出错：${e.message}`, true);
        }
    }
}