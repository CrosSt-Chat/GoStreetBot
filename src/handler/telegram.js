import { ADMIN_ID, bot } from "../../index.js";
import { checkData, log, saveBotData } from "./utils.js";
import { CrosstClient } from "./crosst.js";
import { TelegramCommands } from "./command.js";
import { Markdown } from "./format.js";

export class TelegramClient {
    static async handleMessage(ctx) {
        let msg = ctx.message;
        let user = msg.from.id.toString();
        if (user === ADMIN_ID) {
            let executed = false;
            if (msg.text && msg.text.startsWith('/')) {
                let { text } = msg;
                if (TelegramCommands.hasOwnProperty(text)) {
                    executed = true;
                    TelegramCommands[text]();
                }
            }
            if (!executed)
                await CrosstClient.syncMessage(msg);
        }
    }

    static async syncMessage(data) {
        let { nick, text, trip } = data;
        text = Markdown.toHTML(`${nick} [${trip}]:\n${text}`);
        checkData(data);
        // Telegram 的 Markdown parse 方法和十字街的不一样，todo 自己实现
        try {
            await bot.telegram.sendMessage(ADMIN_ID, text, { parse_mode: 'HTML' });
            saveBotData();
        }
        catch (e) {
            log(`向 Telegram 同步消息时出错：${e.message}`, true);
        }
    }
}