import { bot } from "../../index.js";
import { GROUP_ID } from "../../index.js";
import { checkData, log, saveBotData } from "./utils.js";
import { CrosstClient } from "./crosst.js";
import { TelegramCommands } from "./command.js";

export async function handleTMessage(ctx) {
    let msg = ctx.message;
    if (msg.text && msg.text.startsWith('/')) {
        let { text } = msg;
        if (TelegramCommands.hasOwnProperty(text))
            TelegramCommands[text]();
    }
    else
        CrosstClient.syncMessage(msg);
}

export class TelegramClient {
    static async syncMessage(data) {
        let { nick, text, trip } = data;
        text = `${nick} [${trip}]:\n${text}`;
        checkData(data);
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